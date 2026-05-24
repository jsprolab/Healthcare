import type { IRecordValidator, NppesRow, ProviderRecord } from './types';

const NPI_REGEX = /^\d{10}$/;

/**
 * Validates a raw NPPES row for data quality and normalizes it into a ProviderRecord.
 * Returns null for any row that must be skipped (deactivated, malformed, incomplete).
 * State-level filtering is handled by the ImportRunner — not here.
 */
export class RecordValidator implements IRecordValidator {
  validate(row: NppesRow): ProviderRecord | null {
    if (!NPI_REGEX.test(row.npi)) return null;
    if (row.deactivationDate.trim()) return null;

    const isOrg = row.entityTypeCode === '2';
    const orgName = row.organizationName.trim();
    const lastName = row.lastName.trim();
    const firstName = row.firstName.trim();

    if (isOrg && !orgName) return null;
    if (!isOrg && !lastName && !firstName) return null;

    const city = normalizeCityName(row.practiceCity);
    if (!city) return null;

    return {
      npi: row.npi.trim(),
      firstName: firstName || null,
      lastName: lastName || null,
      organizationName: orgName || null,
      taxonomyCode: pickPrimaryTaxonomyCode(row),
      address1: row.practiceAddress1.trim() || null,
      address2: row.practiceAddress2.trim() || null,
      cityName: city,
      state: row.practiceState.trim().toUpperCase(),
      zipCode: normalizeZip(row.practiceZip),
      phone: normalizePhone(row.practicePhone),
      specialtyId: null, // resolved separately by SpecialtyResolver
    };
  }
}

// ─── Normalization helpers ────────────────────────────────────────────────────

function pickPrimaryTaxonomyCode(row: NppesRow): string | null {
  const primary = row.taxonomies.find((t) => t.isPrimary);
  return primary?.code ?? row.taxonomies[0]?.code ?? null;
}

function normalizeCityName(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** NPPES zips are 5 or 9 digits ("900010001"). Normalize to 5. */
function normalizeZip(zip: string): string | null {
  const trimmed = zip.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 5);
}

/** Store as 10-digit digit-only string, or null. */
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(0, 10) : null;
}
