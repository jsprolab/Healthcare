import { createReadStream } from 'node:fs';
import type { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import type { NppesRow, NppesTaxonomy } from './types';

// ─── Column name constants matching the NPPES data dictionary exactly ────────

const COL = {
  NPI: 'NPI',
  ENTITY_TYPE: 'Entity Type Code',
  ORG_NAME: 'Provider Organization Name (Legal Business Name)',
  LAST_NAME: 'Provider Last Name (Legal Name)',
  FIRST_NAME: 'Provider First Name',
  ADDR1: 'Provider First Line Business Practice Location Address',
  ADDR2: 'Provider Second Line Business Practice Location Address',
  CITY: 'Provider Business Practice Location Address City Name',
  STATE: 'Provider Business Practice Location Address State Name',
  ZIP: 'Provider Business Practice Location Address Postal Code',
  PHONE: 'Provider Business Practice Location Address Telephone Number',
  DEACTIVATION: 'NPI Deactivation Date',
} as const;

const TAXONOMY_COUNT = 15;

export interface NppesParserOptions {
  onProgress?: (recordsRead: number) => void;
  progressInterval?: number;
}

/**
 * Streams an NPPES CSV file and yields one typed NppesRow per record.
 * Memory-safe: only a single parsed row is held in memory at a time.
 */
export async function* parseNppesFile(
  filePath: string,
  options: NppesParserOptions = {}
): AsyncGenerator<NppesRow> {
  const source = createReadStream(filePath, { encoding: 'utf8' });
  yield* parseNppesStream(source, options);
}

/**
 * Accepts any Readable (file stream or in-memory) for testability.
 */
export async function* parseNppesStream(
  source: Readable,
  options: NppesParserOptions = {}
): AsyncGenerator<NppesRow> {
  const { onProgress, progressInterval = 10_000 } = options;

  const parser = source.pipe(
    parse({
      columns: true,
      skipEmptyLines: true,
      trim: true,
      // Tolerate rows with more columns than the header (edge-case in older NPPES exports)
      relax_column_count_more: true,
    })
  );

  let count = 0;
  for await (const row of parser as AsyncIterable<Record<string, string>>) {
    count++;
    if (onProgress && count % progressInterval === 0) {
      onProgress(count);
    }
    yield mapRow(row);
  }
}

// ─── Internal row mapper ──────────────────────────────────────────────────────

function mapRow(row: Record<string, string>): NppesRow {
  return {
    npi: row[COL.NPI] ?? '',
    entityTypeCode: row[COL.ENTITY_TYPE] ?? '',
    organizationName: row[COL.ORG_NAME] ?? '',
    lastName: row[COL.LAST_NAME] ?? '',
    firstName: row[COL.FIRST_NAME] ?? '',
    practiceAddress1: row[COL.ADDR1] ?? '',
    practiceAddress2: row[COL.ADDR2] ?? '',
    practiceCity: row[COL.CITY] ?? '',
    practiceState: row[COL.STATE] ?? '',
    practiceZip: row[COL.ZIP] ?? '',
    practicePhone: row[COL.PHONE] ?? '',
    taxonomies: extractTaxonomies(row),
    deactivationDate: row[COL.DEACTIVATION] ?? '',
  };
}

function extractTaxonomies(row: Record<string, string>): NppesTaxonomy[] {
  const entries: NppesTaxonomy[] = [];
  for (let i = 1; i <= TAXONOMY_COUNT; i++) {
    const code = row[`Healthcare Provider Taxonomy Code_${i}`]?.trim();
    if (!code) continue;
    const isPrimary =
      row[`Healthcare Provider Primary Taxonomy Switch_${i}`]?.trim().toUpperCase() === 'Y';
    entries.push({ code, isPrimary });
  }
  return entries;
}
