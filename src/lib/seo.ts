import { formatPhone } from '@/utils';
import type { ProviderWithRelations } from '@/lib/dtos/provider.dto';
import type { City, Specialty } from '@prisma/client';

export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://healthnavigator.ai').replace(
  /\/$/,
  ''
);

export const SITE_NAME = 'HealthNavigator';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// ─── Title builders ───────────────────────────────────────────────────────────

export function cityTitle(city: City): string {
  return `Healthcare Providers in ${city.name}, CA`;
}

export function citySpecialtyTitle(city: City, specialty: Specialty): string {
  return `${specialty.name} Doctors in ${city.name}, CA`;
}

export function providerTitle(provider: ProviderWithRelations): string {
  const isOrg = !!provider.organizationName;
  const name = isOrg
    ? provider.organizationName!
    : [provider.firstName, provider.lastName].filter(Boolean).join(' ');
  const specialty = provider.specialty?.name;
  const city = provider.city?.name;
  if (specialty && city) return `${name} – ${specialty} in ${city}, CA`;
  if (specialty) return `${name} – ${specialty}`;
  return name || provider.npi;
}

// ─── Description builders ─────────────────────────────────────────────────────

export function cityDescription(city: City): string {
  const count = city.providerCount > 0 ? `${city.providerCount.toLocaleString()} ` : '';
  return `Find ${count}verified healthcare providers in ${city.name}, California. Browse by specialty and view contact information.`;
}

export function citySpecialtyDescription(city: City, specialty: Specialty): string {
  return `Find verified ${specialty.name} doctors and specialists in ${city.name}, CA. View profiles, addresses, and contact information.`;
}

export function providerDescription(provider: ProviderWithRelations): string {
  const isOrg = !!provider.organizationName;
  const name = isOrg
    ? provider.organizationName!
    : [provider.firstName, provider.lastName].filter(Boolean).join(' ');
  const specialty = provider.specialty?.name ?? 'healthcare';
  const city = provider.city?.name;
  if (city) {
    return `${name} is a ${specialty} provider in ${city}, CA. View NPI, address, phone, and contact details.`;
  }
  return `${name} is a ${specialty} provider in California. View NPI and contact details.`;
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
    description: 'Find and compare verified healthcare providers across California.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/ca/{city}`,
      },
      'query-input': 'required name=city',
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
    breadcrumb: buildBreadcrumbSchema(opts.breadcrumbs),
  };
}

export function buildProviderSchema(provider: ProviderWithRelations): JsonLdObject {
  const isOrg = !!provider.organizationName;
  const name = isOrg
    ? provider.organizationName!
    : [provider.firstName, provider.lastName].filter(Boolean).join(' ');

  const streetAddress = [provider.address1, provider.address2].filter(Boolean).join(', ');

  return {
    '@context': 'https://schema.org',
    '@type': isOrg ? 'MedicalOrganization' : 'Physician',
    name,
    identifier: provider.npi,
    url: absoluteUrl(`/provider/${provider.npi}`),
    ...(provider.specialty?.name && { medicalSpecialty: provider.specialty.name }),
    address: {
      '@type': 'PostalAddress',
      ...(streetAddress && { streetAddress }),
      ...(provider.city?.name && { addressLocality: provider.city.name }),
      addressRegion: provider.state ?? 'CA',
      ...(provider.zipCode && { postalCode: provider.zipCode }),
      addressCountry: 'US',
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
  };
}
