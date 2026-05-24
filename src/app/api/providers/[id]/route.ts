import { type NextRequest, NextResponse } from 'next/server';
import { ProviderIdSchema } from '@/lib/schemas/provider.schema';
import { ProviderService } from '@/services/providers';
import { PrismaProviderRepository } from '@/repositories/provider.repository';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function makeService() {
  return new ProviderService(new PrismaProviderRepository(prisma));
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const parsed = ProviderIdSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid provider ID' }, { status: 400 });
    }

    const provider = await makeService().getById(parsed.data);
    return NextResponse.json({ success: true, data: provider });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
