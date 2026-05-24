import type {
  IImportLogger,
  IProviderWriter,
  IRecordValidator,
  ISpecialtyResolver,
  ImportConfig,
  ImportStats,
  NppesRow,
  ProviderRecord,
} from './types';

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_LOG_INTERVAL = 50_000;

/**
 * Orchestrates the NPPES import pipeline:
 *   CSV rows → state filter → validate → resolve specialty → batch → write
 *
 * All dependencies are injected for full testability.
 */
export class ImportRunner {
  constructor(
    private readonly validator: IRecordValidator,
    private readonly specialtyResolver: ISpecialtyResolver,
    private readonly writer: IProviderWriter,
    private readonly logger: IImportLogger = console
  ) {}

  async run(source: AsyncIterable<NppesRow>, config: ImportConfig): Promise<ImportStats> {
    const batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE;
    const state = config.stateFilter.toUpperCase();

    const startedAt = new Date();
    let total = 0;
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    let batch: ProviderRecord[] = [];

    this.logger.info(
      `Starting import  state=${state}  batch=${batchSize}  dry-run=${config.dryRun}`
    );

    for await (const row of source) {
      total++;

      // ── State filter (cheap — skip before full validation) ─────────────────
      if (row.practiceState.trim().toUpperCase() !== state) {
        skipped++;
        continue;
      }

      // ── Data validation + normalization ────────────────────────────────────
      const record = this.validator.validate(row);
      if (!record) {
        skipped++;
        continue;
      }

      // ── Specialty resolution ───────────────────────────────────────────────
      record.specialtyId = this.specialtyResolver.resolve(row.taxonomies);

      batch.push(record);

      // ── Flush when batch is full ───────────────────────────────────────────
      if (batch.length >= batchSize) {
        const result = config.dryRun
          ? { imported: batch.length, errors: 0 }
          : await this.writer.writeBatch(batch);

        imported += result.imported;
        errors += result.errors;
        batch = [];

        if (total % DEFAULT_LOG_INTERVAL === 0) {
          this.logger.info(
            `  Progress: ${total.toLocaleString()} rows read  ` +
              `${imported.toLocaleString()} imported  ` +
              `${skipped.toLocaleString()} skipped`
          );
        }
      }
    }

    // ── Final flush ───────────────────────────────────────────────────────────
    if (batch.length > 0) {
      const result = config.dryRun
        ? { imported: batch.length, errors: 0 }
        : await this.writer.writeBatch(batch);
      imported += result.imported;
      errors += result.errors;
    }

    const completedAt = new Date();
    const stats: ImportStats = {
      totalRecords: total,
      importedRecords: imported,
      skippedRecords: skipped,
      errorRecords: errors,
      processingTimeMs: completedAt.getTime() - startedAt.getTime(),
      startedAt,
      completedAt,
    };

    this.logSummary(stats);
    return stats;
  }

  private logSummary(stats: ImportStats): void {
    const dur = formatDuration(stats.processingTimeMs);
    this.logger.info('');
    this.logger.info('═══ Import Summary ═══════════════════════════════════');
    this.logger.info(`  Total records read  : ${stats.totalRecords.toLocaleString()}`);
    this.logger.info(`  Imported            : ${stats.importedRecords.toLocaleString()}`);
    this.logger.info(`  Skipped             : ${stats.skippedRecords.toLocaleString()}`);
    this.logger.info(`  Errors              : ${stats.errorRecords.toLocaleString()}`);
    this.logger.info(`  Duration            : ${dur}`);
    this.logger.info('══════════════════════════════════════════════════════');
  }
}

function formatDuration(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${(s % 60).toFixed(1)}s`;
}
