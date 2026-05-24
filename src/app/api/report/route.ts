import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { npi, field, message, email } = body;

    if (!npi || !/^\d{10}$/.test(npi)) {
      return NextResponse.json({ error: 'Invalid NPI' }, { status: 400 });
    }
    if (!field || typeof field !== 'string' || field.length > 50) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }
    if (email && (typeof email !== 'string' || email.length > 200)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    await prisma.dataReport.create({
      data: {
        npi,
        field: field.trim(),
        message: message.trim(),
        email: email?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
