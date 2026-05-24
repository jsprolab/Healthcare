import { NextResponse } from 'next/server';
import { getAllSpecialties } from '@/services/specialties';
import type { ApiResponse } from '@/types';
import type { Specialty } from '@prisma/client';

// Specialties rarely change — cache for 1 hour
export const revalidate = 3600;

export async function GET() {
  try {
    const specialties = await getAllSpecialties();
    return NextResponse.json({
      success: true,
      data: specialties,
    } satisfies ApiResponse<Specialty[]>);
  } catch (error) {
    console.error('[GET /api/specialties]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch specialties' } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
