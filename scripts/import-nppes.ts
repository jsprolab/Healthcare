#!/usr/bin/env tsx
/**
 * NPPES Provider Import CLI
 *
 * Usage:
 *   npm run import:nppes -- <filepath> [options]
 *
 * Options:
 *   --batch-size <n>   Records per DB transaction  (default: 100)
 *   --state <code>     2-letter state filter       (default: CA)
 *   --dry-run          Parse and validate only — no DB writes
 *
 * Example:
 *   npm run import:nppes -- ./data/npidata_pfile.csv
 *   npm run import:nppes -- ./data/npidata_pfile.csv --batch-size 200 --dry-run
 */

import { existsSync } from 'node:fs';
import { prisma } from '@/lib/prisma';
import { parseNppesFile } from '@/features/import/NppesParser';
import { createImportRunner } from '@/features/import/factory';
import type { ImportConfig } from '@/features/import/types';

// ─── Argument parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
  Usage: npm run import:nppes -- <filepath> [options]

  Options:
    --batch-size <n>   Records per DB transaction (default: 100)
    --state <code>     2-letter state filter      (default: CA)
    --dry-run          Validate only — skip DB writes

  Example:
    npm run import:nppes -- ./data/npidata_pfile.csv
    npm run import:nppes -- ./data/npidata_pfile.csv --dry-run
  `);
  process.exit(0);
}

function parseArgs(argv: string[]): {
  filePath: string;
  batchSize: number;
  state: string;
  dryRun: boolean;
} {
  const filePath = argv[0];
  let batchSize = 100;
  let state = 'CA';
  let dryRun = false;

  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--batch-size' && argv[i + 1]) {
      const n = parseInt(argv[++i], 10);
      if (isNaN(n) || n < 1) {
        console.error('--batch-size must be a positive integer');
        process.exit(1);
      }
      batchSize = n;
    } else if (argv[i] === '--state' && argv[i + 1]) {
      state = argv[++i].toUpperCase();
    } else if (argv[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { filePath, batchSize, state, dryRun };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { filePath, batchSize, state, dryRun } = parseArgs(args);

  if (!existsSync(filePath)) {
    console.error(`Error: file not found — ${filePath}`);
    process.exit(1);
  }

  const config: ImportConfig = {
    filePath,
    batchSize,
    stateFilter: state,
    dryRun,
  };

  if (dryRun) {
    console.log('[import:nppes] DRY RUN — no records will be written to the database');
  }

  const runner = await createImportRunner(prisma, { stateFilter: state });

  const source = parseNppesFile(filePath, {
    onProgress: (n) => console.log(`  [parse] ${n.toLocaleString()} rows read...`),
    progressInterval: 50_000,
  });

  const stats = await runner.run(source, config);

  // Exit with error code if any records failed to write
  if (stats.errorRecords > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error('[import:nppes] Fatal error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
