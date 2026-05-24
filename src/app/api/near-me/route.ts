import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lng = request.nextUrl.searchParams.get('lng');
  if (!lat || !lng) return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: { 'User-Agent': 'HealthNavigator/1.0 (healthnavigator.ai)' },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) throw new Error('nominatim failed');
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? null;
    const state = addr.state ?? null;
    const isCA = state === 'California';
    return NextResponse.json({ city, state, isCA });
  } catch {
    return NextResponse.json({ error: 'Could not determine location' }, { status: 500 });
  }
}
