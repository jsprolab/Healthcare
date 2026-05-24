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
import { Readable } from 'node:stream';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parser } = require('stream-json') as { parser: (opts?: object) => NodeJS.ReadWriteStream };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pick } = require('stream-json/filters/Pick') as {
  pick: (opts?: object) => NodeJS.ReadWriteStream;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { streamArray } = require('stream-json/streamers/StreamArray') as {
  streamArray: () => NodeJS.ReadWriteStream;
};
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

async function streamNpis(
  source: Readable,
  hint: string,
  knownNpis: Set<string>,
  onBatch: OnBatch,
  batchSize = 500
) {
  const seen = new Set<string>();
  let pending: string[] = [];
  let items = 0;

  const stream = maybeGunzip(source, hint)
    .pipe(parser({ streamValues: false }))
    .pipe(pick({ filter: 'in_network' }))
    .pipe(streamArray()) as AsyncIterable<{ value: unknown }>;

  async function flush() {
    if (pending.length === 0) return;
    await onBatch(pending);
    pending = [];
  }

  for await (const { value } of stream) {
    items++;
    const item = value as InNetworkItem;
    for (const rate of item.negotiated_rates ?? []) {
      for (const group of rate.provider_groups ?? []) {
        for (const raw of group.npi ?? []) {
          const npi = String(raw).padStart(10, '0');
          if (!seen.has(npi) && knownNpis.has(npi)) {
            seen.add(npi);
            pending.push(npi);
            if (pending.length >= batchSize) await flush();
          }
        }
      }
    }
    if (items % 1000 === 0) {
      process.stdout.write(`\r  ${fmt(items)} billing codes · ${fmt(seen.size)} matching NPIs`);
    }
  }

  await flush();
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

async function processMrf(
  url: string | null,
  file: string | null,
  planId: string,
  knownNpis: Set<string>
): Promise<number> {
  const hint = url ?? file ?? '';
  const source = file ? createReadStream(file) : await fetchStream(url!);
  let inserted = 0;

  await streamNpis(source, hint, knownNpis, async (batch) => {
    inserted += await insertBatch(planId, batch);
  });

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
