import { type NextRequest, NextResponse } from 'next/server';
import { ProviderSearchSchema } from '@/lib/schemas/provider.schema';
import { ProviderService } from '@/services/providers';
import { PrismaProviderRepository } from '@/repositories/provider.repository';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';

function makeService() {
  return new ProviderService(new PrismaProviderRepository(prisma));
}

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = ProviderSearchSchema.safeParse(raw);

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const result = await makeService().search(parsed.data);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
