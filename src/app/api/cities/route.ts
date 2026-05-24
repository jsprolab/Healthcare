import { type NextRequest, NextResponse } from 'next/server';
import { getCitiesByState } from '@/services/cities';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';
import type { City } from '@prisma/client';

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state');

  try {
    const cities = state
      ? await getCitiesByState(state)
      : await prisma.city.findMany({ orderBy: [{ state: 'asc' }, { name: 'asc' }] });

    return NextResponse.json({
      success: true,
      data: cities,
    } satisfies ApiResponse<City[]>);
  } catch (error) {
    console.error('[GET /api/cities]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
