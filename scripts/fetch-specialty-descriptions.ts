#!/usr/bin/env tsx
/**
 * Fetches specialty descriptions from Wikipedia REST API and stores them in the DB.
 * Usage: DATABASE_URL=... npx tsx scripts/fetch-specialty-descriptions.ts
 */
import { prisma } from '@/lib/prisma';

const WIKIPEDIA = 'https://en.wikipedia.org/api/rest_v1/page/summary';

// Manual overrides for specialties whose Wikipedia title differs from their name
const TITLE_OVERRIDES: Record<string, string> = {
  'Family Medicine': 'Family medicine',
  'Internal Medicine': 'Internal medicine',
  'Emergency Medicine': 'Emergency medicine',
  'Physical Medicine': 'Physical medicine and rehabilitation',
  'Nuclear Medicine': 'Nuclear medicine',
  'Preventive Medicine': 'Preventive medicine',
  'Occupational Medicine': 'Occupational medicine',
  'Sports Medicine': 'Sports medicine',
  'Sleep Medicine': 'Sleep medicine',
  'Addiction Medicine': 'Addiction medicine',
  'Hospice and Palliative Medicine': 'Palliative care',
  'Interventional Cardiology': 'Interventional cardiology',
};

async function fetchSummary(name: string): Promise<string | null> {
  const title = TITLE_OVERRIDES[name] ?? name;
  const url = `${WIKIPEDIA}/${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HealthNavigator/1.0 (educational)' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { extract?: string; type?: string };
    if (data.type === 'disambiguation' || !data.extract) return null;
    // Take first 2 sentences max
    const sentences = data.extract.split(/(?<=[.!?])\s+/);
    return sentences.slice(0, 2).join(' ').trim();
  } catch {
    return null;
  }
}

async function main() {
  const specialties = await prisma.specialty.findMany({ orderBy: { name: 'asc' } });
  console.log(`Fetching descriptions for ${specialties.length} specialties…\n`);

  let updated = 0;
  for (const s of specialties) {
    const description = await fetchSummary(s.name);
    if (description) {
      await prisma.specialty.update({ where: { id: s.id }, data: { description } });
      console.log(`✓ ${s.name}`);
      updated++;
    } else {
      console.log(`✗ ${s.name} (not found)`);
    }
    await new Promise((r) => setTimeout(r, 300)); // polite rate limit
  }

  console.log(`\nDone — updated ${updated}/${specialties.length} specialties.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
