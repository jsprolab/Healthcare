import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('npis') ?? '';
  const npis = raw
    .split(',')
    .map((n) => n.trim())
    .filter((n) => /^\d{10}$/.test(n))
    .slice(0, 50);

  if (npis.length === 0) {
    return NextResponse.json({ providers: [] });
  }

  const providers = await prisma.provider.findMany({
    where: { npi: { in: npis } },
    include: { specialty: true, city: true },
  });

  return NextResponse.json({
    providers: providers.map((p) => ({
      npi: p.npi,
      name: p.organizationName ?? [p.firstName, p.lastName].filter(Boolean).join(' '),
      specialty: p.specialty?.name ?? null,
      city: p.city?.name ?? null,
      citySlug: p.city?.slug ?? null,
      isOrg: !!p.organizationName,
      acceptsMedicare: p.acceptsMedicare ?? false,
      telehealth: p.telehealth ?? false,
      credentials: p.credentials ?? null,
    })),
  });
}
