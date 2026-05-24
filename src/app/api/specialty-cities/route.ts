import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/specialty-cities?specialty=<slug>&cities=slug1,slug2,...
// Returns { [citySlug]: providerCount } for the given specialty
export async function GET(req: NextRequest) {
  const specialtySlug = req.nextUrl.searchParams.get('specialty');
  const citySlugsParam = req.nextUrl.searchParams.get('cities');

  if (!specialtySlug || !citySlugsParam) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const citySlugs = citySlugsParam.split(',').slice(0, 50);

  const [specialty, cityRows] = await Promise.all([
    prisma.specialty.findUnique({ where: { slug: specialtySlug }, select: { id: true } }),
    prisma.city.findMany({
      where: { slug: { in: citySlugs }, state: 'CA' },
      select: { id: true, slug: true },
    }),
  ]);

  if (!specialty) return NextResponse.json({});

  const cityIdToSlug = new Map(cityRows.map((c) => [c.id, c.slug]));

  const counts = await prisma.provider.groupBy({
    by: ['cityId'],
    where: { specialtyId: specialty.id, cityId: { in: cityRows.map((c) => c.id) } },
    _count: { _all: true },
  });

  const result: Record<string, number> = {};
  for (const row of counts) {
    if (row.cityId) {
      const slug = cityIdToSlug.get(row.cityId);
      if (slug) result[slug] = row._count._all;
    }
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  });
}
