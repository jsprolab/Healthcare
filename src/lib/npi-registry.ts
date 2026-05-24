export interface NpiAddress {
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  telephone_number?: string;
  fax_number?: string;
  address_purpose: 'LOCATION' | 'MAILING';
}

export interface NpiTaxonomy {
  code: string;
  desc: string;
  license?: string;
  state?: string;
  primary: boolean;
}

export interface NpiBasic {
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  credential?: string;
  sex?: string;
  enumeration_date?: string;
  last_updated?: string;
  status?: string;
  sole_proprietor?: string;
  authorized_official_first_name?: string;
  authorized_official_last_name?: string;
  authorized_official_title_or_position?: string;
}

export interface NpiResult {
  number: string;
  enumeration_type: string;
  basic: NpiBasic;
  addresses: NpiAddress[];
  practiceLocations: NpiAddress[];
  taxonomies: NpiTaxonomy[];
}

export async function fetchNpiRegistry(npi: string): Promise<NpiResult | null> {
  try {
    const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?number=${npi}&version=2.1`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.result_count ?? 0) > 0 ? (json.results[0] as NpiResult) : null;
  } catch {
    return null;
  }
}

export function formatPostalCode(code: string): string {
  return code.length === 9 ? `${code.slice(0, 5)}-${code.slice(5)}` : code;
}

export function sexLabel(sex?: string): string | null {
  if (sex === 'M') return 'Male';
  if (sex === 'F') return 'Female';
  return null;
}
