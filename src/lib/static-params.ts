import { prisma } from '@/lib/prisma';

export async function getCaSpecialtyParams(): Promise<{ city: string; specialty: string }[]> {
  // Cap at top 500 combos to keep build time sane; dynamicParams=true handles the rest via ISR
  const groups = await prisma.provider.groupBy({
    by: ['cityId', 'specialtyId'],
    where: {
      cityId: { not: null },
      specialtyId: { not: null },
      city: { state: 'CA' },
    },
    _count: { _all: true },
    orderBy: { _count: { cityId: 'desc' } },
    take: 500,
  });

  if (groups.length === 0) return [];

  const cityIds = [...new Set(groups.map((g) => g.cityId!))];
  const specialtyIds = [...new Set(groups.map((g) => g.specialtyId!))];

  const [cities, specialties] = await Promise.all([
    prisma.city.findMany({ where: { id: { in: cityIds } }, select: { id: true, slug: true } }),
    prisma.specialty.findMany({
      where: { id: { in: specialtyIds } },
      select: { id: true, slug: true },
    }),
  ]);

  const cityMap = new Map(cities.map((c) => [c.id, c.slug]));
  const specialtyMap = new Map(specialties.map((s) => [s.id, s.slug]));

  return groups
    .filter((g) => cityMap.has(g.cityId!) && specialtyMap.has(g.specialtyId!))
    .map((g) => ({
      city: cityMap.get(g.cityId!)!,
      specialty: specialtyMap.get(g.specialtyId!)!,
    }));
}
