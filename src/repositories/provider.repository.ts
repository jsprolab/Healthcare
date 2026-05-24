import type { PrismaClient, Prisma } from '@prisma/client';
import type { ProviderWithRelations } from '@/lib/dtos/provider.dto';
import type { ProviderSearchParams } from '@/lib/schemas/provider.schema';

export interface PaginatedProviders {
  providers: ProviderWithRelations[];
  total: number;
}

export interface IProviderRepository {
  search(params: ProviderSearchParams): Promise<PaginatedProviders>;
  findById(id: string): Promise<ProviderWithRelations | null>;
}

const providerInclude = {
  specialty: true,
  city: true,
  acceptedPlans: { include: { plan: true } },
} as const;

function buildWhere(params: ProviderSearchParams): Prisma.ProviderWhereInput {
  return {
    ...(params.specialty && { specialty: { slug: params.specialty } }),
    ...(params.city && { city: { slug: params.city } }),
    ...(params.state && { state: params.state }),
    ...(params.zipCode && { zipCode: { startsWith: params.zipCode.slice(0, 5) } }),
  };
}

export class PrismaProviderRepository implements IProviderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async search(params: ProviderSearchParams): Promise<PaginatedProviders> {
    const skip = (params.page - 1) * params.pageSize;
    const where = buildWhere(params);
    const orderBy = {
      [params.sortBy]: params.sortOrder,
    } as Prisma.ProviderOrderByWithRelationInput;

    const [providers, total] = await this.prisma.$transaction([
      this.prisma.provider.findMany({
        where,
        include: providerInclude,
        skip,
        take: params.pageSize,
        orderBy,
      }),
      this.prisma.provider.count({ where }),
    ]);

    return { providers, total };
  }

  async findById(id: string): Promise<ProviderWithRelations | null> {
    return this.prisma.provider.findUnique({ where: { id }, include: providerInclude });
  }
}
