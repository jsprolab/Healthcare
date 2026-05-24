import { prisma } from '@/lib/prisma';
import type { Specialty } from '@prisma/client';

export type SpecialtyWithCount = Specialty & { providerCount: number };

export async function getAllSpecialties(): Promise<SpecialtyWithCount[]> {
  const rows = await prisma.specialty.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { providers: true } } },
  });
  return rows.map(({ _count, ...s }) => ({ ...s, providerCount: _count.providers }));
}

export async function getSpecialtyBySlug(slug: string): Promise<Specialty | null> {
  return prisma.specialty.findUnique({ where: { slug } });
}
