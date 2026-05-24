import type { Prisma } from '@prisma/client';
import { formatPhone } from '@/utils';

export type ProviderWithRelations = Prisma.ProviderGetPayload<{
  include: { specialty: true; city: true };
}>;

export interface ProviderResponseDto {
  id: string;
  npi: string;
  displayName: string;
  isOrganization: boolean;
  taxonomyCode: string | null;
  address1: string | null;
  address2: string | null;
  state: string | null;
  zipCode: string | null;
  phoneFormatted: string;
  coordinates: { latitude: number; longitude: number } | null;
  specialty: { id: string; name: string; slug: string } | null;
  city: { id: string; name: string; state: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
}

export function toProviderDto(p: ProviderWithRelations): ProviderResponseDto {
  const isOrganization = !!p.organizationName;
  const displayName = isOrganization
    ? (p.organizationName ?? '')
    : [p.firstName, p.lastName].filter(Boolean).join(' ');

  const coordinates =
    p.latitude != null && p.longitude != null
      ? { latitude: p.latitude.toNumber(), longitude: p.longitude.toNumber() }
      : null;

  return {
    id: p.id,
    npi: p.npi,
    displayName,
    isOrganization,
    taxonomyCode: p.taxonomyCode,
    address1: p.address1,
    address2: p.address2,
    state: p.state,
    zipCode: p.zipCode,
    phoneFormatted: formatPhone(p.phone),
    coordinates,
    specialty: p.specialty
      ? { id: p.specialty.id, name: p.specialty.name, slug: p.specialty.slug }
      : null,
    city: p.city
      ? { id: p.city.id, name: p.city.name, state: p.city.state, slug: p.city.slug }
      : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
