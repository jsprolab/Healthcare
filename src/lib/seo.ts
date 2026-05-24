import { formatPhone } from '@/utils';
import type { ProviderWithRelations } from '@/lib/dtos/provider.dto';
import type { City, Specialty } from '@prisma/client';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://healthnavigator-usa.vercel.app'
).replace(/\/$/, '');

export const SITE_NAME = 'HealthNavigator';

export const DATA_SOURCE = 'CMS NPPES National Provider Identifier Registry';
export const DATA_DISCLAIMER =
  'This directory is for informational purposes only and is not a substitute for professional medical advice. Always call the provider to confirm availability, insurance, and appointment details before visiting.';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// ─── Title builders ───────────────────────────────────────────────────────────

export function cityTitle(city: City): string {
  return `Healthcare Providers in ${city.name}, CA | ${SITE_NAME}`;
}

export function citySpecialtyTitle(city: City, specialty: Specialty): string {
  return `${specialty.name} in ${city.name}, CA – Find Doctors & Specialists`;
}

export function providerTitle(provider: ProviderWithRelations): string {
  const isOrg = !!provider.organizationName;
  const name = isOrg
    ? provider.organizationName!
    : [provider.firstName, provider.lastName].filter(Boolean).join(' ');
  const specialty = provider.specialty?.name;
  const city = provider.city?.name;
  if (specialty && city) return `${name} – ${specialty} | ${city}, CA`;
  if (specialty) return `${name} – ${specialty} | California`;
  return `${name} | California Healthcare Provider`;
}

// ─── Description builders ─────────────────────────────────────────────────────

export function cityDescription(city: City): string {
  const count = city.providerCount > 0 ? `${city.providerCount.toLocaleString()} ` : '';
  return `Browse ${count}NPI-verified healthcare providers in ${city.name}, California. Filter by specialty, Medicare, and telehealth. Data from CMS NPPES.`;
}

export function citySpecialtyDescription(city: City, specialty: Specialty): string {
  return `Find verified ${specialty.name} doctors and specialists in ${city.name}, CA. View NPI numbers, addresses, phone numbers, and insurance info. Sourced from CMS NPPES.`;
}

export function providerDescription(provider: ProviderWithRelations): string {
  const isOrg = !!provider.organizationName;
  const name = isOrg
    ? provider.organizationName!
    : [provider.firstName, provider.lastName].filter(Boolean).join(' ');
  const specialty = provider.specialty?.name ?? 'healthcare';
  const city = provider.city?.name;
  const phone = provider.phone ? ` Call ${formatPhone(provider.phone)}.` : '';
  if (city) {
    return `${name} is an NPI-registered ${specialty} provider in ${city}, CA.${phone} View address, contact info, and Medicare status. Data from CMS NPPES.`;
  }
  return `${name} is an NPI-registered ${specialty} provider in California.${phone} View NPI, contact details, and Medicare status.`;
}

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

type JsonLdObject = Record<string, unknown>;
type BreadcrumbItem = { name: string; url: string };

export function buildWebSiteSchema(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Find and compare NPI-verified healthcare providers across California. Sourced from CMS NPPES.',
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebPageSchema(opts: {
  name: string;
  description: string;
  url: string;
  breadcrumbs: BreadcrumbItem[];
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    breadcrumb: buildBreadcrumbSchema(opts.breadcrumbs),
  };
}

export function buildProviderSchema(provider: ProviderWithRelations): JsonLdObject {
  const isOrg = !!provider.organizationName;
  const name = isOrg
    ? provider.organizationName!
    : [provider.firstName, provider.lastName].filter(Boolean).join(' ');

  const streetAddress = [provider.address1, provider.address2].filter(Boolean).join(', ');

  const base: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': isOrg ? 'MedicalOrganization' : 'Physician',
    name,
    identifier: [{ '@type': 'PropertyValue', name: 'NPI', value: provider.npi }],
    url: absoluteUrl(`/provider/${provider.npi}`),
    ...(provider.specialty?.name && { medicalSpecialty: provider.specialty.name }),
    address: {
      '@type': 'PostalAddress',
      ...(streetAddress && { streetAddress }),
      ...(provider.city?.name && { addressLocality: provider.city.name }),
      addressRegion: provider.state ?? 'CA',
      addressCountry: 'US',
      ...(provider.zipCode && { postalCode: provider.zipCode }),
    },
    ...(provider.phone && { telephone: formatPhone(provider.phone) }),
    ...(provider.latitude != null &&
      provider.longitude != null && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: provider.latitude.toNumber(),
          longitude: provider.longitude.toNumber(),
        },
      }),
    ...(provider.acceptsMedicare && {
      availableService: {
        '@type': 'MedicalTherapy',
        name: 'Medicare',
      },
    }),
  };

  if (!isOrg) {
    base.gender = provider.gender === 'M' ? 'Male' : provider.gender === 'F' ? 'Female' : undefined;
    if (provider.credentials) base.honorificSuffix = provider.credentials;
  }

  return base;
}
