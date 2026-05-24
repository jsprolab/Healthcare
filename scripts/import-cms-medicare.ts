#!/usr/bin/env tsx
/**
 * CMS Medicare Provider Import
 *
 * Fetches the "Medicare Physicians and Other Clinicians" dataset from CMS
 * for California and updates providers with:
 *   - acceptsMedicare  (ind_assgn = 'Y')
 *   - telehealth       (telehlth = 'Y')
 *   - gender           (gndr = 'M' | 'F')
 *   - credentials      (cred e.g. 'MD', 'DO', 'NP')
 *
 * Usage:
 *   npm run import:cms-medicare
 *   npm run import:cms-medicare -- --dry-run
 *   npm run import:cms-medicare -- --state TX
 *
 * Data source: https://data.cms.gov/provider-data/dataset/mj5m-pzi6
 */

import { prisma } from '@/lib/prisma';

const CMS_API = 'https://data.cms.gov/provider-data/api/1/datastore/query/mj5m-pzi6/0';
const PAGE_SIZE = 1_500;

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const stateArg = args.find((a) => a.startsWith('--state'));
const STATE = stateArg ? (stateArg.split('=')[1] ?? args[args.indexOf(stateArg) + 1]) : 'CA';

// ─── CMS row type ─────────────────────────────────────────────────────────────

interface CmsRow {
  npi: string;
  ind_assgn?: string; // Y = accepts Medicare assignment
  grp_assgn?: string;
  telehlth?: string; // Y = offers telehealth
  gndr?: string; // M / F
  cred?: string; // MD, DO, NP, PA, …
  med_sch?: string; // medical school name
  grd_yr?: string; // graduation year (4-digit)
  state?: string;
}

interface CmsResponse {
  results: CmsRow[];
  count: number; // total rows matching the filter
}

// ─── Fetch one page ───────────────────────────────────────────────────────────

async function fetchPage(offset: number): Promise<CmsResponse> {
  const url = new URL(CMS_API);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  // Filter by state
  url.searchParams.set('conditions[0][property]', 'state');
  url.searchParams.set('conditions[0][value]', STATE);
  url.searchParams.set('conditions[0][operator]', '=');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`CMS API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<CmsResponse>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nCMS Medicare import — state: ${STATE}${dryRun ? ' [DRY RUN]' : ''}\n`);

  // Fetch first page to get total count
  console.log('Fetching page 1…');
  const first = await fetchPage(0);
  const total = first.count;
  const pages = Math.ceil(total / PAGE_SIZE);
  console.log(`Total CMS rows for ${STATE}: ${total.toLocaleString()} across ${pages} pages\n`);

  const allRows: CmsRow[] = [...first.results];

  // Fetch remaining pages in parallel batches of 10
  const CONCURRENCY = 10;
  for (let page = 1; page < pages; page += CONCURRENCY) {
    const batch = Array.from({ length: Math.min(CONCURRENCY, pages - page) }, (_, i) => page + i);
    console.log(`Fetching pages ${batch[0] + 1}–${batch[batch.length - 1] + 1}/${pages}…`);
    const batchResults = await Promise.all(batch.map((p) => fetchPage(p * PAGE_SIZE)));
    batchResults.forEach(({ results }) => allRows.push(...results));
  }

  console.log(`\nFetched ${allRows.length.toLocaleString()} rows. Processing…\n`);

  // Build NPI → update map
  const updates = new Map<
    string,
    {
      acceptsMedicare: boolean;
      telehealth: boolean;
      gender: string | null;
      credentials: string | null;
      medSchool: string | null;
      gradYear: number | null;
    }
  >();

  for (const row of allRows) {
    if (!row.npi || !/^\d{10}$/.test(row.npi.trim())) continue;
    const gradYearRaw = row.grd_yr?.trim();
    const gradYear = gradYearRaw && /^\d{4}$/.test(gradYearRaw) ? parseInt(gradYearRaw, 10) : null;
    updates.set(row.npi.trim(), {
      acceptsMedicare:
        row.ind_assgn?.trim().toUpperCase() === 'Y' || row.grp_assgn?.trim().toUpperCase() === 'Y',
      telehealth: row.telehlth?.trim().toUpperCase() === 'Y',
      gender:
        row.gndr?.trim().toUpperCase() === 'M'
          ? 'M'
          : row.gndr?.trim().toUpperCase() === 'F'
            ? 'F'
            : null,
      credentials: row.cred?.trim() || null,
      medSchool: row.med_sch?.trim() || null,
      gradYear,
    });
  }

  console.log(`Unique NPIs from CMS: ${updates.size.toLocaleString()}`);

  if (dryRun) {
    let medicare = 0,
      tele = 0;
    for (const v of updates.values()) {
      if (v.acceptsMedicare) medicare++;
      if (v.telehealth) tele++;
    }
    console.log(`\n[DRY RUN] Would update:`);
    console.log(`  Accepts Medicare: ${medicare.toLocaleString()}`);
    console.log(`  Telehealth:       ${tele.toLocaleString()}`);
    console.log('\nNo DB changes made.');
    return;
  }

  // Apply updates in batches
  const BATCH = 500;
  const npis = [...updates.keys()];
  let updated = 0;
  let skipped = 0;

  console.log(`\nApplying updates in batches of ${BATCH}…`);

  for (let i = 0; i < npis.length; i += BATCH) {
    const batch = npis.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((npi) => {
        const data = updates.get(npi)!;
        return prisma.provider.updateMany({
          where: { npi },
          data: {
            acceptsMedicare: data.acceptsMedicare,
            telehealth: data.telehealth,
            gender: data.gender,
            credentials: data.credentials ?? undefined,
            medSchool: data.medSchool ?? undefined,
            gradYear: data.gradYear ?? undefined,
          },
        });
      })
    );

    const batchUpdated = results.reduce((s, r) => s + r.count, 0);
    const batchSkipped = batch.length - batchUpdated;
    updated += batchUpdated;
    skipped += batchSkipped;

    if ((i / BATCH) % 10 === 0) {
      console.log(
        `  Progress: ${Math.min(i + BATCH, npis.length).toLocaleString()}/${npis.length.toLocaleString()} NPIs processed`
      );
    }
  }

  console.log(`\n✓ Done!`);
  console.log(`  Updated in DB:  ${updated.toLocaleString()}`);
  console.log(
    `  Not in DB:      ${skipped.toLocaleString()} (CMS providers not in your CA dataset)`
  );

  // Summary stats
  const [medicareCount, telehealthCount, genderM, genderF] = await Promise.all([
    prisma.provider.count({ where: { acceptsMedicare: true } }),
    prisma.provider.count({ where: { telehealth: true } }),
    prisma.provider.count({ where: { gender: 'M' } }),
    prisma.provider.count({ where: { gender: 'F' } }),
  ]);

  console.log(`\nDB totals after import:`);
  console.log(`  Accepts Medicare: ${medicareCount.toLocaleString()}`);
  console.log(`  Telehealth:       ${telehealthCount.toLocaleString()}`);
  console.log(`  Gender M:         ${genderM.toLocaleString()}`);
  console.log(`  Gender F:         ${genderF.toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
