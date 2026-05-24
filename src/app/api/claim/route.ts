import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { npi, claimantName, claimantEmail, acceptingPatients, message } = body;

    if (!npi || !/^\d{10}$/.test(npi)) {
      return NextResponse.json({ error: 'Invalid NPI' }, { status: 400 });
    }
    if (!claimantName || typeof claimantName !== 'string' || claimantName.trim().length < 2) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    if (!claimantEmail || typeof claimantEmail !== 'string' || !claimantEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check for duplicate pending claim
    const existing = await prisma.providerClaim.findFirst({
      where: { npi, claimantEmail: claimantEmail.trim(), status: 'pending' },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A pending claim already exists for this provider' },
        { status: 409 }
      );
    }

    await prisma.providerClaim.create({
      data: {
        npi,
        claimantName: claimantName.trim(),
        claimantEmail: claimantEmail.trim().toLowerCase(),
        acceptingPatients: !!acceptingPatients,
        message: message?.trim() || null,
        status: 'pending',
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
