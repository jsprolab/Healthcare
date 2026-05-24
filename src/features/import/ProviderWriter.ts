import type { PrismaClient } from '@prisma/client';
import type { BatchWriteResult, ICityCache, IProviderWriter, ProviderRecord } from './types';

type ResolvedRecord = ProviderRecord & { cityId: string };

/**
 * Writes a batch of ProviderRecords to the database via upsert (keyed on NPI).
 *
 * Strategy:
 * 1. Resolve all city IDs (from CityCache — cheap; usually cache hits).
 * 2. Attempt a single interactive Prisma $transaction (sequential upserts in one TX).
 * 3. If the transaction fails, fall back to individual upserts to isolate bad rows.
 *
 * The interactive transaction form is used (callback) rather than the array form, so
 * that no Prisma promises are created eagerly before the transaction begins.
 */
export class ProviderWriter implements IProviderWriter {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cityCache: ICityCache
  ) {}

  async writeBatch(records: ProviderRecord[]): Promise<BatchWriteResult> {
    if (records.length === 0) return { imported: 0, errors: 0 };

    const resolved = await this.resolveCityIds(records);
    return this.runTransaction(resolved);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async resolveCityIds(records: ProviderRecord[]): Promise<ResolvedRecord[]> {
    const out: ResolvedRecord[] = [];
    for (const record of records) {
      const cityId = await this.cityCache.getOrCreate(record.cityName, record.state);
      out.push({ ...record, cityId });
    }
    return out;
  }

  private async runTransaction(records: ResolvedRecord[]): Promise<BatchWriteResult> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const r of records) {
          await tx.provider.upsert(this.buildUpsertArgs(r));
        }
      });
      return { imported: records.length, errors: 0 };
    } catch {
      return this.runIndividually(records);
    }
  }

  private async runIndividually(records: ResolvedRecord[]): Promise<BatchWriteResult> {
    let imported = 0;
    let errors = 0;
    for (const r of records) {
      try {
        await this.prisma.provider.upsert(this.buildUpsertArgs(r));
        imported++;
      } catch {
        errors++;
      }
    }
    return { imported, errors };
  }

  private buildUpsertArgs(r: ResolvedRecord) {
    const data = {
      npi: r.npi,
      firstName: r.firstName,
      lastName: r.lastName,
      organizationName: r.organizationName,
      taxonomyCode: r.taxonomyCode,
      address1: r.address1,
      address2: r.address2,
      state: r.state,
      zipCode: r.zipCode,
      phone: r.phone,
      specialtyId: r.specialtyId,
      cityId: r.cityId,
    };
    return { where: { npi: r.npi }, create: data, update: data };
  }
}
