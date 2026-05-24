import type { NppesTaxonomy } from './types';

/**
 * Maps NUCC Health Care Provider Taxonomy codes to the specialty slugs seeded in the DB.
 * Source: https://www.nucc.org/index.php/code-sets-mainmenu-41/provider-taxonomy-mainmenu-40
 *
 * Only codes that map to one of the 16 seeded specialties are included.
 * Unmapped codes result in a null specialtyId on the provider row.
 */
export const TAXONOMY_SLUG_MAP: Readonly<Record<string, string>> = {
  // ── Family Medicine ───────────────────────────────────────────────────────
  '207Q00000X': 'family-medicine',
  '207QA0000X': 'family-medicine',
  '207QB0002X': 'family-medicine',
  '207QG0300X': 'family-medicine',
  '207QH0002X': 'family-medicine',
  '207QS0010X': 'family-medicine',
  '207QS1201X': 'family-medicine',

  // ── Internal Medicine ─────────────────────────────────────────────────────
  '207R00000X': 'internal-medicine',
  '207RA0000X': 'internal-medicine',
  '207RB0002X': 'internal-medicine',
  '207RC0200X': 'internal-medicine',
  '207RG0300X': 'internal-medicine',
  '207RH0002X': 'internal-medicine',
  '207RI0001X': 'internal-medicine',
  '207RI0200X': 'internal-medicine',
  '207RR0500X': 'internal-medicine',

  // ── Pediatrics ────────────────────────────────────────────────────────────
  '208000000X': 'pediatrics',
  '2080A0000X': 'pediatrics',
  '2080H0100X': 'pediatrics',
  '2080N0001X': 'pediatrics',
  '2080P0006X': 'pediatrics',
  '2082S0099X': 'pediatrics',

  // ── Obstetrics & Gynecology ───────────────────────────────────────────────
  '207V00000X': 'obstetrics-gynecology',
  '207VB0002X': 'obstetrics-gynecology',
  '207VE0102X': 'obstetrics-gynecology',
  '207VH0002X': 'obstetrics-gynecology',
  '207VM0101X': 'obstetrics-gynecology',
  '207VX0201X': 'obstetrics-gynecology',

  // ── Cardiology ────────────────────────────────────────────────────────────
  '207RC0000X': 'cardiology',
  '207RC0001X': 'cardiology',
  '207RI0011X': 'cardiology',

  // ── Dermatology ───────────────────────────────────────────────────────────
  '207N00000X': 'dermatology',
  '207ND0101X': 'dermatology',
  '207ND0900X': 'dermatology',
  '207NI0002X': 'dermatology',

  // ── Orthopedic Surgery ────────────────────────────────────────────────────
  '207X00000X': 'orthopedic-surgery',
  '207XS0106X': 'orthopedic-surgery',
  '207XS0114X': 'orthopedic-surgery',
  '207XS0117X': 'orthopedic-surgery',
  '207XX0004X': 'orthopedic-surgery',

  // ── Neurology ─────────────────────────────────────────────────────────────
  '2084N0400X': 'neurology',
  '2084N0402X': 'neurology',
  '2084P2900X': 'neurology',
  '2084S0010X': 'neurology',
  '2084V0102X': 'neurology',

  // ── Psychiatry ────────────────────────────────────────────────────────────
  '2084P0800X': 'psychiatry',
  '2084P0804X': 'psychiatry',
  '2084P0805X': 'psychiatry',
  '2084B0040X': 'psychiatry',

  // ── Ophthalmology ─────────────────────────────────────────────────────────
  '207W00000X': 'ophthalmology',
  '207WX0200X': 'ophthalmology',

  // ── Gastroenterology ─────────────────────────────────────────────────────
  '207RG0100X': 'gastroenterology',

  // ── Pulmonology ───────────────────────────────────────────────────────────
  '207RU0001X': 'pulmonology',
  '207RS0010X': 'pulmonology',

  // ── Endocrinology ─────────────────────────────────────────────────────────
  '207RE0101X': 'endocrinology',

  // ── Nephrology ────────────────────────────────────────────────────────────
  '207RN0300X': 'nephrology',

  // ── Oncology ─────────────────────────────────────────────────────────────
  '207RH0000X': 'oncology',
  '207RX0202X': 'oncology',
  '2086X0206X': 'oncology',

  // ── Emergency Medicine ────────────────────────────────────────────────────
  '207P00000X': 'emergency-medicine',
  '207PE0004X': 'emergency-medicine',
  '207PP0204X': 'emergency-medicine',
  '207PT0002X': 'emergency-medicine',
};

/** Returns the specialty slug for the best matching taxonomy entry, or null. */
export function resolveSlugFromTaxonomies(taxonomies: NppesTaxonomy[]): string | null {
  // Prefer primary-marked entries
  for (const t of taxonomies) {
    if (t.isPrimary && TAXONOMY_SLUG_MAP[t.code]) {
      return TAXONOMY_SLUG_MAP[t.code];
    }
  }
  // Fall back to the first entry with any known mapping
  for (const t of taxonomies) {
    if (TAXONOMY_SLUG_MAP[t.code]) {
      return TAXONOMY_SLUG_MAP[t.code];
    }
  }
  return null;
}
