// ─── Raw CSV row from NPPES file ─────────────────────────────────────────────

export interface NppesTaxonomy {
  code: string;
  isPrimary: boolean;
}

/** One row from the NPPES dissemination CSV, typed but not yet validated. */
export interface NppesRow {
  npi: string;
  entityTypeCode: string; // '1' = individual, '2' = organization
  organizationName: string;
  lastName: string;
  firstName: string;
  practiceAddress1: string;
  practiceAddress2: string;
  practiceCity: string;
  practiceState: string;
  practiceZip: string;
  practicePhone: string;
  taxonomies: NppesTaxonomy[];
  deactivationDate: string;
}

// ─── Domain record ready for a DB upsert ─────────────────────────────────────

/** Validated, normalized provider ready to be written to the database. */
export interface ProviderRecord {
  npi: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  taxonomyCode: string | null;
  address1: string | null;
  address2: string | null;
  cityName: string;
  state: string;
  zipCode: string | null;
  phone: string | null;
  specialtyId: string | null;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export interface BatchWriteResult {
  imported: number;
  errors: number;
}

export interface ImportStats {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  processingTimeMs: number;
  startedAt: Date;
  completedAt: Date;
}

export interface ImportConfig {
  filePath: string;
  batchSize: number;
  stateFilter: string;
  dryRun: boolean;
}

// ─── Interfaces (Dependency Inversion Principle) ─────────────────────────────

export interface IRecordValidator {
  /** Returns a normalized ProviderRecord, or null if the row must be skipped. */
  validate(row: NppesRow): ProviderRecord | null;
}

export interface ISpecialtyResolver {
  /** Resolves the best matching specialty DB id from a list of taxonomy entries. */
  resolve(taxonomies: NppesTaxonomy[]): string | null;
}

export interface ICityCache {
  /** Returns the DB id for a city, creating it if it doesn't exist. */
  getOrCreate(cityName: string, state: string): Promise<string>;
}

export interface IProviderWriter {
  /** Writes a batch of records, returning counts of successes and failures. */
  writeBatch(records: ProviderRecord[]): Promise<BatchWriteResult>;
}

export interface IImportLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}
