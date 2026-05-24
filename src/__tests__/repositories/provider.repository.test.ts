import { PrismaProviderRepository } from '@/repositories/provider.repository';
import type { ProviderSearchParams } from '@/lib/schemas/provider.schema';
import type { PrismaClient } from '@prisma/client';

function makeDefaultParams(overrides: Partial<ProviderSearchParams> = {}): ProviderSearchParams {
  return {
    page: 1,
    pageSize: 20,
    sortBy: 'lastName',
    sortOrder: 'asc',
    ...overrides,
  };
}

function makeMockPrisma() {
  const findMany = jest.fn().mockResolvedValue([]);
  const count = jest.fn().mockResolvedValue(0);
  const findUnique = jest.fn().mockResolvedValue(null);
  const $transaction = jest
    .fn()
    .mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries));

  return {
    provider: { findMany, count, findUnique },
    $transaction,
    _findMany: findMany,
    _count: count,
    _findUnique: findUnique,
  } as unknown as PrismaClient & {
    _findMany: jest.Mock;
    _count: jest.Mock;
    _findUnique: jest.Mock;
  };
}

describe('PrismaProviderRepository', () => {
  describe('search', () => {
    it('calls findMany and count in a transaction', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      const result = await repo.search(makeDefaultParams());

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ providers: [], total: 0 });
    });

    it('applies skip based on page and pageSize', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      await repo.search(makeDefaultParams({ page: 3, pageSize: 10 }));

      // $transaction receives an array of promises; findMany was called with skip=20
      const findManyCalls = (prisma as unknown as { _findMany: jest.Mock })._findMany.mock.calls;
      expect(findManyCalls[0][0]).toMatchObject({ skip: 20, take: 10 });
    });

    it('filters by specialty slug', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      await repo.search(makeDefaultParams({ specialty: 'family-medicine' }));

      const findManyCalls = (prisma as unknown as { _findMany: jest.Mock })._findMany.mock.calls;
      expect(findManyCalls[0][0].where).toMatchObject({
        specialty: { slug: 'family-medicine' },
      });
    });

    it('filters by city slug', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      await repo.search(makeDefaultParams({ city: 'san-francisco' }));

      const findManyCalls = (prisma as unknown as { _findMany: jest.Mock })._findMany.mock.calls;
      expect(findManyCalls[0][0].where).toMatchObject({
        city: { slug: 'san-francisco' },
      });
    });

    it('filters by state', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      await repo.search(makeDefaultParams({ state: 'CA' }));

      const findManyCalls = (prisma as unknown as { _findMany: jest.Mock })._findMany.mock.calls;
      expect(findManyCalls[0][0].where).toMatchObject({ state: 'CA' });
    });

    it('filters by zipCode using first 5 digits', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      await repo.search(makeDefaultParams({ zipCode: '94102-1234' }));

      const findManyCalls = (prisma as unknown as { _findMany: jest.Mock })._findMany.mock.calls;
      expect(findManyCalls[0][0].where).toMatchObject({
        zipCode: { startsWith: '94102' },
      });
    });

    it('applies sortBy and sortOrder', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      await repo.search(makeDefaultParams({ sortBy: 'createdAt', sortOrder: 'desc' }));

      const findManyCalls = (prisma as unknown as { _findMany: jest.Mock })._findMany.mock.calls;
      expect(findManyCalls[0][0].orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('findById', () => {
    it('calls findUnique with the given id', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      await repo.findById('provider-123');

      expect((prisma as unknown as { _findUnique: jest.Mock })._findUnique).toHaveBeenCalledWith({
        where: { id: 'provider-123' },
        include: { specialty: true, city: true },
      });
    });

    it('returns null when provider does not exist', async () => {
      const prisma = makeMockPrisma();
      const repo = new PrismaProviderRepository(prisma);
      const result = await repo.findById('nonexistent');
      expect(result).toBeNull();
    });
  });
});
