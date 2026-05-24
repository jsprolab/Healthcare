import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ZIP_RE = /^\d{5}(-\d{4})?$/;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ providers: [], cities: [], specialties: [] });
  }

  const isZip = ZIP_RE.test(q) || (q.length === 5 && /^\d+$/.test(q));

  if (isZip) {
    const zip = q.slice(0, 5);
    const providers = await prisma.provider.findMany({
      where: { zipCode: { startsWith: zip }, city: { state: 'CA' } },
      include: { specialty: true, city: true },
      orderBy: { lastName: 'asc' },
      take: 5,
    });

    // Find the unique cities in that zip for the cities section
    const cityIds = [...new Set(providers.map((p) => p.cityId).filter(Boolean))] as string[];
    const zipCities = await prisma.city.findMany({
      where: { id: { in: cityIds } },
      orderBy: { providerCount: 'desc' },
    });

    return NextResponse.json({
      providers: providers.map((p) => ({
        npi: p.npi,
        name: p.organizationName ?? [p.firstName, p.lastName].filter(Boolean).join(' '),
        specialty: p.specialty?.name ?? null,
        city: p.city?.name ?? null,
        citySlug: p.city?.slug ?? null,
        specialtySlug: p.specialty?.slug ?? null,
        isOrg: !!p.organizationName,
        zipCode: p.zipCode,
        acceptsMedicare: p.acceptsMedicare ?? false,
        telehealth: p.telehealth ?? false,
      })),
      cities: zipCities.map((c) => ({
        slug: c.slug,
        name: c.name,
        providerCount: c.providerCount,
      })),
      specialties: [],
      isZipSearch: true,
      zip,
    });
  }

  const words = q.split(/\s+/);
  const multi = words.length >= 2;

  const [providers, cities, specialties] = await Promise.all([
    prisma.provider.findMany({
      where: {
        OR: multi
          ? [
              {
                firstName: { startsWith: words[0], mode: 'insensitive' },
                lastName: { startsWith: words[words.length - 1], mode: 'insensitive' },
              },
              { organizationName: { contains: q, mode: 'insensitive' } },
            ]
          : [
              { lastName: { startsWith: q, mode: 'insensitive' } },
              { organizationName: { startsWith: q, mode: 'insensitive' } },
            ],
        city: { state: 'CA' },
      },
      include: { specialty: true, city: true },
      take: 5,
    }),
    prisma.city.findMany({
      where: { state: 'CA', providerCount: { gt: 0 }, name: { contains: q, mode: 'insensitive' } },
      orderBy: { providerCount: 'desc' },
      take: 4,
    }),
    prisma.specialty.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    providers: providers.map((p) => ({
      npi: p.npi,
      name: p.organizationName ?? [p.firstName, p.lastName].filter(Boolean).join(' '),
      specialty: p.specialty?.name ?? null,
      city: p.city?.name ?? null,
      citySlug: p.city?.slug ?? null,
      specialtySlug: p.specialty?.slug ?? null,
      isOrg: !!p.organizationName,
      acceptsMedicare: p.acceptsMedicare ?? false,
      telehealth: p.telehealth ?? false,
    })),
    cities: cities.map((c) => ({ slug: c.slug, name: c.name, providerCount: c.providerCount })),
    specialties: specialties.map((s) => ({ slug: s.slug, name: s.name })),
  });
}
