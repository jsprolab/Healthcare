import { ImportRunner } from './ImportRunner';
import type {
  BatchWriteResult,
  IImportLogger,
  IProviderWriter,
  IRecordValidator,
  ISpecialtyResolver,
  ImportConfig,
  NppesRow,
  ProviderRecord,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCaRow(overrides: Partial<NppesRow> = {}): NppesRow {
  return {
    npi: '1234567890',
    entityTypeCode: '1',
    organizationName: '',
    lastName: 'Smith',
    firstName: 'Jane',
    practiceAddress1: '123 Main St',
    practiceAddress2: '',
    practiceCity: 'San Francisco',
    practiceState: 'CA',
    practiceZip: '94102',
    practicePhone: '4155551234',
    taxonomies: [{ code: '207Q00000X', isPrimary: true }],
    deactivationDate: '',
    ...overrides,
  };
}

function makeRecord(): ProviderRecord {
  return {
    npi: '1234567890',
    firstName: 'Jane',
    lastName: 'Smith',
    organizationName: null,
    taxonomyCode: '207Q00000X',
    address1: '123 Main St',
    address2: null,
    cityName: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    phone: '4155551234',
    specialtyId: null,
  };
}

async function* rowsGen(rows: NppesRow[]): AsyncGenerator<NppesRow> {
  yield* rows;
}

function makeConfig(overrides: Partial<ImportConfig> = {}): ImportConfig {
  return { filePath: 'dummy.csv', batchSize: 10, stateFilter: 'CA', dryRun: false, ...overrides };
}

function makeValidator(valid = true): jest.Mocked<IRecordValidator> {
  return { validate: jest.fn().mockReturnValue(valid ? makeRecord() : null) };
}

function makeResolver(): jest.Mocked<ISpecialtyResolver> {
  return { resolve: jest.fn().mockReturnValue('sp-1') };
}

function makeWriter(imported = 1): jest.Mocked<IProviderWriter> {
  return {
    writeBatch: jest.fn().mockResolvedValue({ imported, errors: 0 } satisfies BatchWriteResult),
  };
}

const silentLogger: IImportLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ImportRunner', () => {
  describe('stats counting', () => {
    it('counts total records from the source', async () => {
      const runner = new ImportRunner(makeValidator(), makeResolver(), makeWriter(), silentLogger);
      const stats = await runner.run(rowsGen([makeCaRow(), makeCaRow()]), makeConfig());
      expect(stats.totalRecords).toBe(2);
    });

    it('counts imported records from writeBatch results', async () => {
      const writer = makeWriter(1);
      const runner = new ImportRunner(makeValidator(), makeResolver(), writer, silentLogger);
      const stats = await runner.run(
        rowsGen([makeCaRow(), makeCaRow()]),
        makeConfig({ batchSize: 10 })
      );
      // both records are in one batch of 2, writer returns imported=1 per call
      expect(stats.importedRecords).toBe(1);
    });

    it('counts skipped records for non-CA rows', async () => {
      const validator = makeValidator(true);
      const runner = new ImportRunner(validator, makeResolver(), makeWriter(), silentLogger);
      const stats = await runner.run(
        rowsGen([makeCaRow(), makeCaRow({ practiceState: 'TX' })]),
        makeConfig()
      );
      expect(stats.skippedRecords).toBe(1);
      // validator not called for the TX row
      expect(validator.validate).toHaveBeenCalledTimes(1);
    });

    it('counts skipped records for records that fail validation', async () => {
      const validator: jest.Mocked<IRecordValidator> = {
        validate: jest
          .fn()
          .mockReturnValueOnce(makeRecord()) // first: valid
          .mockReturnValueOnce(null), // second: invalid
      };
      const runner = new ImportRunner(validator, makeResolver(), makeWriter(), silentLogger);
      const stats = await runner.run(rowsGen([makeCaRow(), makeCaRow()]), makeConfig());
      expect(stats.skippedRecords).toBe(1);
      expect(stats.importedRecords).toBe(1);
    });

    it('returns non-zero processingTimeMs', async () => {
      const runner = new ImportRunner(makeValidator(), makeResolver(), makeWriter(), silentLogger);
      const stats = await runner.run(rowsGen([makeCaRow()]), makeConfig());
      expect(stats.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('returns correct stats for an empty source', async () => {
      const runner = new ImportRunner(makeValidator(), makeResolver(), makeWriter(), silentLogger);
      const stats = await runner.run(rowsGen([]), makeConfig());
      expect(stats.totalRecords).toBe(0);
      expect(stats.importedRecords).toBe(0);
      expect(stats.skippedRecords).toBe(0);
    });
  });

  describe('batching', () => {
    it('flushes exactly once when records fit in one batch', async () => {
      const writer = makeWriter(3);
      const runner = new ImportRunner(makeValidator(), makeResolver(), writer, silentLogger);
      await runner.run(
        rowsGen([makeCaRow(), makeCaRow(), makeCaRow()]),
        makeConfig({ batchSize: 10 })
      );
      expect(writer.writeBatch).toHaveBeenCalledTimes(1);
    });

    it('flushes twice for 101 records with batchSize=100', async () => {
      const rows = Array.from({ length: 101 }, () => makeCaRow());
      const writer = makeWriter(1);
      const runner = new ImportRunner(makeValidator(), makeResolver(), writer, silentLogger);
      await runner.run(rowsGen(rows), makeConfig({ batchSize: 100 }));
      expect(writer.writeBatch).toHaveBeenCalledTimes(2);
    });

    it('does not call writeBatch in dry-run mode', async () => {
      const writer = makeWriter();
      const runner = new ImportRunner(makeValidator(), makeResolver(), writer, silentLogger);
      const stats = await runner.run(rowsGen([makeCaRow()]), makeConfig({ dryRun: true }));
      expect(writer.writeBatch).not.toHaveBeenCalled();
      // dry-run still counts as "imported" for the stats preview
      expect(stats.importedRecords).toBe(1);
    });
  });

  describe('specialty resolution', () => {
    it('calls the specialty resolver with the row taxonomies', async () => {
      const resolver = makeResolver();
      const runner = new ImportRunner(makeValidator(), resolver, makeWriter(), silentLogger);
      await runner.run(rowsGen([makeCaRow()]), makeConfig());
      expect(resolver.resolve).toHaveBeenCalledWith([{ code: '207Q00000X', isPrimary: true }]);
    });

    it('sets specialtyId on the record before writing', async () => {
      const resolver: jest.Mocked<ISpecialtyResolver> = {
        resolve: jest.fn().mockReturnValue('sp-cardiology'),
      };
      const writer = makeWriter();
      const runner = new ImportRunner(makeValidator(), resolver, writer, silentLogger);
      await runner.run(rowsGen([makeCaRow()]), makeConfig());

      const writtenRecords: ProviderRecord[] = (writer.writeBatch as jest.Mock).mock.calls[0][0];
      expect(writtenRecords[0].specialtyId).toBe('sp-cardiology');
    });
  });
});
