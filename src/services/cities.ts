import { prisma } from '@/lib/prisma';
import type { City } from '@prisma/client';

export interface CityListParams {
  state: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CityListResult {
  cities: City[];
  total: number;
  totalProviders: number;
}

export async function getCitiesByState(state: string): Promise<City[]> {
  return prisma.city.findMany({
    where: { state: state.toUpperCase() },
    orderBy: { name: 'asc' },
  });
}

export async function getCitiesPaginated({
  state,
  search,
  page = 1,
  pageSize = 24,
}: CityListParams): Promise<CityListResult> {
  const where = {
    state: state.toUpperCase(),
    providerCount: { gt: 0 },
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  const [cities, total, providerAgg] = await prisma.$transaction([
    prisma.city.findMany({
      where,
      orderBy: { providerCount: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.city.count({ where }),
    prisma.city.aggregate({ where, _sum: { providerCount: true } }),
  ]);

  return {
    cities,
    total,
    totalProviders: providerAgg._sum.providerCount ?? 0,
  };
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  return prisma.city.findUnique({ where: { slug } });
}
