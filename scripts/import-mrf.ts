/**
 * CMS Transparency in Coverage — MRF in-network file importer
 *
 * Streams a (possibly gzipped) MRF JSON file and extracts the NPI→plan
 * mapping without loading the whole file into memory.
 *
 * Usage — single MRF file from URL:
 *   npx tsx scripts/import-mrf.ts \
 *     --url "https://example.com/anthem-ca-mrf.json.gz" \
 *     --insurer "Anthem Blue Cross" \
 *     --plan "PPO Plus 2024"
 *
 * Usage — local gzipped file:
 *   npx tsx scripts/import-mrf.ts \
 *     --file ./anthem-ca-mrf.json.gz \
 *     --insurer "Anthem Blue Cross"
 *
 * Usage — index file (auto-discovers all MRF URLs):
 *   npx tsx scripts/import-mrf.ts \
 *     --index "https://example.com/anthem-index.json" \
 *     --insurer "Anthem Blue Cross"
 *
 * MRF format: https://github.com/CMSgov/price-transparency-guide
 * Key path:   in_network[].negotiated_rates[].provider_groups[].npi[]
 */

import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { Readable, type Duplex } from 'node:stream';
import parserStream from 'stream-json';
import pick from 'stream-json/filters/pick';
import streamArray from 'stream-json/streamers/stream-array';
import { prisma } from '../src/lib/prisma';

// ─── CLI args ─────────────────────────────────────────────────────────────────

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const MRF_URL = arg('--url');
const MRF_FILE = arg('--file');
const INDEX_URL = arg('--index');
const INSURER = arg('--insurer');
const PLAN_NAME = arg('--plan') ?? INSURER ?? 'In-Network';
const STATE_FILTER = arg('--state'); // e.g. "california" or "ca" — filters index by filename/description

if (!INSURER || (!MRF_URL && !MRF_FILE && !INDEX_URL)) {
  console.error('Usage:');
  console.error('  npx tsx scripts/import-mrf.ts --url <url> --insurer <name> [--plan <plan>]');
  console.error('  npx tsx scripts/import-mrf.ts --file <path> --insurer <name>');
  console.error(
    '  npx tsx scripts/import-mrf.ts --index <url> --insurer <name> [--state california]'
  );
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString();

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchStream(url: string): Promise<Readable> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HealthNavigator-MRF-Import/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  if (!res.body) throw new Error('No response body');
  return Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
}

function maybeGunzip(stream: Readable, hint: string): Readable {
  return hint.endsWith('.gz') || hint.endsWith('.gzip') ? stream.pipe(createGunzip()) : stream;
}

// ─── Index file discovery ─────────────────────────────────────────────────────

async function discoverMrfUrls(indexUrl: string, stateFilter?: string): Promise<string[]> {
  console.log(`Fetching index: ${indexUrl}`);
  const res = await fetch(indexUrl, {
    headers: { 'User-Agent': 'HealthNavigator-MRF-Import/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as {
    reporting_structure?: Array<{
      in_network_files?: Array<{ location: string; description?: string }>;
    }>;
  };
  const urls = (data.reporting_structure ?? [])
    .flatMap((s) => s.in_network_files ?? [])
    .filter((f) => {
      if (!stateFilter) return true;
      const loc = (f.location ?? '').toLowerCase();
      const desc = (f.description ?? '').toLowerCase();
      const st = stateFilter.toLowerCase();
      return loc.includes(st) || desc.includes(st);
    })
    .map((f) => f.location)
    .filter(Boolean);
  if (stateFilter) console.log(`  Filtered to "${stateFilter}": ${urls.length} file(s)`);
  else console.log(`  Found ${urls.length} in-network file(s)`);
  return urls;
}

// ─── Streaming NPI extractor ──────────────────────────────────────────────────

type OnBatch = (npis: string[]) => Promise<void>;

interface InNetworkItem {
  negotiated_rates?: Array<{
    provider_groups?: Array<{ npi?: number[] }>;
  }>;
}

// CMS MRF v2.0: provider_references[].provider_groups[].npi[]
interface ProviderReference {
  provider_group_id?: number;
  provider_groups?: Array<{ npi?: number[] }>;
}

function collectNpis(
  groups: Array<{ npi?: number[] }>,
  seen: Set<string>,
  knownNpis: Set<string>,
  pending: string[]
) {
  for (const group of groups) {
    for (const raw of group.npi ?? []) {
      const npi = String(raw).padStart(10, '0');
      if (!seen.has(npi) && knownNpis.has(npi)) {
        seen.add(npi);
        pending.push(npi);
      }
    }
  }
}

// v2.0 format: NPIs live in top-level provider_references
async function streamNpisFromRefs(
  source: Readable,
  hint: string,
  knownNpis: Set<string>,
  onBatch: OnBatch,
  batchSize = 500
): Promise<number> {
  const seen = new Set<string>();
  let pending: string[] = [];
  let items = 0;

  const stream = maybeGunzip(source, hint)
    .pipe(parserStream({ streamValues: false }) as Duplex)
    .pipe(pick.asStream({ filter: 'provider_references' }) as Duplex)
    .pipe(streamArray.asStream() as Duplex) as AsyncIterable<{ value: unknown }>;

  for await (const { value } of stream) {
    items++;
    const ref = value as ProviderReference;
    collectNpis(ref.provider_groups ?? [], seen, knownNpis, pending);
    if (pending.length >= batchSize) {
      await onBatch(pending);
      pending = [];
    }
    if (items % 200 === 0) {
      process.stdout.write(`\r  ${fmt(items)} provider refs · ${fmt(seen.size)} matching NPIs`);
    }
  }

  if (pending.length > 0) await onBatch(pending);
  process.stdout.write(`\r  ${fmt(items)} provider refs · ${fmt(seen.size)} matching NPIs\n`);
  return seen.size;
}

// v1 format: NPIs inline in in_network[].negotiated_rates[].provider_groups[]
async function streamNpisFromInNetwork(
  source: Readable,
  hint: string,
  knownNpis: Set<string>,
  onBatch: OnBatch,
  batchSize = 500
): Promise<number> {
  const seen = new Set<string>();
  let pending: string[] = [];
  let items = 0;

  const stream = maybeGunzip(source, hint)
    .pipe(parserStream({ streamValues: false }) as Duplex)
    .pipe(pick.asStream({ filter: 'in_network' }) as Duplex)
    .pipe(streamArray.asStream() as Duplex) as AsyncIterable<{ value: unknown }>;

  for await (const { value } of stream) {
    items++;
    const item = value as InNetworkItem;
    for (const rate of item.negotiated_rates ?? []) {
      collectNpis(rate.provider_groups ?? [], seen, knownNpis, pending);
      if (pending.length >= batchSize) {
        await onBatch(pending);
        pending = [];
      }
    }
    if (items % 1000 === 0) {
      process.stdout.write(`\r  ${fmt(items)} billing codes · ${fmt(seen.size)} matching NPIs`);
    }
  }

  if (pending.length > 0) await onBatch(pending);
  process.stdout.write(`\r  ${fmt(items)} billing codes · ${fmt(seen.size)} matching NPIs\n`);
  return seen.size;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function upsertPlan(insurer: string, planName: string) {
  const slug = slugify(insurer);
  return prisma.insurancePlan.upsert({
    where: { slug },
    create: { insurer, name: planName, slug },
    update: { name: planName },
    select: { id: true },
  });
}

async function insertBatch(planId: string, npis: string[]): Promise<number> {
  const providers = await prisma.provider.findMany({
    where: { npi: { in: npis } },
    select: { id: true },
  });
  if (providers.length === 0) return 0;
  await prisma.providerInsurance.createMany({
    data: providers.map((p) => ({ providerId: p.id, planId })),
    skipDuplicates: true,
  });
  return providers.length;
}

// ─── Process one MRF file ─────────────────────────────────────────────────────

async function detectMrfVersion(
  url: string | null,
  file: string | null,
  hint: string
): Promise<'refs' | 'inline'> {
  // Peek at first 4KB to check for "provider_references" key before "in_network"
  let chunk = '';
  if (file) {
    const s = createReadStream(file, { end: 4095 });
    for await (const c of s) chunk += c.toString();
  } else {
    const res = await fetch(url!, {
      headers: { 'User-Agent': 'HealthNavigator-MRF-Import/1.0', Range: 'bytes=0-4095' },
    });
    chunk = await res.text();
  }
  // If file is gzipped we can't peek reliably; default to inline (v1)
  if (hint.endsWith('.gz') || hint.endsWith('.gzip')) return 'inline';
  return chunk.includes('"provider_references"') ? 'refs' : 'inline';
}

async function processMrf(
  url: string | null,
  file: string | null,
  planId: string,
  knownNpis: Set<string>
): Promise<number> {
  const hint = url ?? file ?? '';
  const version = await detectMrfVersion(url, file, hint);
  console.log(
    `  Format: ${version === 'refs' ? 'CMS v2.0 (provider_references)' : 'CMS v1 (inline)'}`
  );

  const source = file ? createReadStream(file) : await fetchStream(url!);
  let inserted = 0;
  const onBatch = async (batch: string[]) => {
    inserted += await insertBatch(planId, batch);
  };

  if (version === 'refs') {
    await streamNpisFromRefs(source, hint, knownNpis, onBatch);
  } else {
    await streamNpisFromInNetwork(source, hint, knownNpis, onBatch);
  }

  return inserted;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nInsurer : ${INSURER}`);
  console.log(`Plan    : ${PLAN_NAME}`);

  console.log('\nLoading provider NPIs from DB…');
  const rows = await prisma.provider.findMany({ select: { npi: true } });
  const knownNpis = new Set(rows.map((r) => r.npi));
  console.log(`  ${fmt(knownNpis.size)} NPIs loaded`);

  const { id: planId } = await upsertPlan(INSURER!, PLAN_NAME);
  console.log(`  Plan ID: ${planId}\n`);

  let totalInserted = 0;

  if (INDEX_URL) {
    const urls = await discoverMrfUrls(INDEX_URL, STATE_FILTER);
    for (let i = 0; i < urls.length; i++) {
      console.log(`File ${i + 1}/${urls.length}: ${urls[i]}`);
      try {
        const n = await processMrf(urls[i], null, planId, knownNpis);
        totalInserted += n;
        console.log(`  → ${fmt(n)} inserted`);
      } catch (err) {
        console.error(`  ✗ ${err instanceof Error ? err.message : err}`);
      }
    }
  } else {
    totalInserted = await processMrf(MRF_URL ?? null, MRF_FILE ?? null, planId, knownNpis);
  }

  const finalCount = await prisma.providerInsurance.count({ where: { planId } });
  console.log(`\n✓ Complete — ${fmt(finalCount)} provider–plan relationships for "${INSURER}"`);
  console.log(`  (${fmt(totalInserted)} inserted this run)`);
}

main().finally(() => prisma.$disconnect());
