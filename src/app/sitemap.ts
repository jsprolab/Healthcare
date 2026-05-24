import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [cities, specialties] = await Promise.all([
    prisma.city.findMany({
      where: { state: 'CA', providerCount: { gt: 0 } },
      select: { slug: true },
      orderBy: { providerCount: 'desc' },
    }),
    prisma.specialty.findMany({ select: { id: true, slug: true } }),
  ]);

  // Top city+specialty combos with at least 1 provider — capped at 5000
  const topCombos = await prisma.provider.groupBy({
    by: ['cityId', 'specialtyId'],
    where: { city: { state: 'CA' }, cityId: { not: null }, specialtyId: { not: null } },
    _count: { npi: true },
    orderBy: { _count: { npi: 'desc' } },
    take: 5000,
  });

  const allCities = await prisma.city.findMany({ select: { id: true, slug: true } });
  const cityMap = new Map(allCities.map((c) => [c.id, c.slug]));
  const specialtyMap = new Map(specialties.map((s) => [s.id, s.slug]));

  const comboPages: MetadataRoute.Sitemap = topCombos
    .filter((g) => g.cityId && g.specialtyId)
    .map((g) => {
      const citySlug = cityMap.get(g.cityId!);
      const specialtySlug = specialtyMap.get(g.specialtyId!);
      if (!citySlug || !specialtySlug) return null;
      return {
        url: absoluteUrl(`/ca/${citySlug}/${specialtySlug}`),
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: absoluteUrl('/ca'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...cities.map((c) => ({
      url: absoluteUrl(`/ca/${c.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...comboPages,
  ];
}
