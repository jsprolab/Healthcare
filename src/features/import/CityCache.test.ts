import { CityCache } from './CityCache';
import type { PrismaClient } from '@prisma/client';

function makeMockPrisma(
  existingCities: Array<{ id: string; name: string; state: string; slug: string }> = []
) {
  const upsertMock = jest
    .fn()
    .mockImplementation(({ create }) => Promise.resolve({ id: `city-${create.slug}`, ...create }));
  return {
    city: {
      findMany: jest.fn().mockResolvedValue(existingCities),
      upsert: upsertMock,
    },
    _upsertMock: upsertMock,
  } as unknown as PrismaClient & { _upsertMock: jest.Mock };
}

describe('CityCache', () => {
  it('creates a new city and returns its id', async () => {
    const prisma = makeMockPrisma();
    const cache = new CityCache(prisma);

    const id = await cache.getOrCreate('San Francisco', 'CA');
    expect(id).toBeTruthy();
    expect((prisma as ReturnType<typeof makeMockPrisma>)._upsertMock).toHaveBeenCalledTimes(1);
  });

  it('returns the same id on a second call without a duplicate upsert', async () => {
    const prisma = makeMockPrisma();
    const cache = new CityCache(prisma);

    const id1 = await cache.getOrCreate('Los Angeles', 'CA');
    const id2 = await cache.getOrCreate('Los Angeles', 'CA');

    expect(id1).toBe(id2);
    expect((prisma as ReturnType<typeof makeMockPrisma>)._upsertMock).toHaveBeenCalledTimes(1);
  });

  it('concurrent calls for the same city trigger only one upsert', async () => {
    const prisma = makeMockPrisma();
    const cache = new CityCache(prisma);

    const [id1, id2, id3] = await Promise.all([
      cache.getOrCreate('Oakland', 'CA'),
      cache.getOrCreate('Oakland', 'CA'),
      cache.getOrCreate('Oakland', 'CA'),
    ]);

    expect(id1).toBe(id2);
    expect(id2).toBe(id3);
    expect((prisma as ReturnType<typeof makeMockPrisma>)._upsertMock).toHaveBeenCalledTimes(1);
  });

  it('creates separate entries for different cities', async () => {
    const prisma = makeMockPrisma();
    const cache = new CityCache(prisma);

    const id1 = await cache.getOrCreate('San Diego', 'CA');
    const id2 = await cache.getOrCreate('Fresno', 'CA');

    expect(id1).not.toBe(id2);
    expect((prisma as ReturnType<typeof makeMockPrisma>)._upsertMock).toHaveBeenCalledTimes(2);
  });

  it('preload populates the cache so no upserts are needed', async () => {
    const existing = [{ id: 'city-la', name: 'Los Angeles', state: 'CA', slug: 'los-angeles-ca' }];
    const prisma = makeMockPrisma(existing);
    const cache = new CityCache(prisma);

    await cache.preload('CA');
    const id = await cache.getOrCreate('Los Angeles', 'CA');

    expect(id).toBe('city-la');
    expect((prisma as ReturnType<typeof makeMockPrisma>)._upsertMock).not.toHaveBeenCalled();
  });

  it('is case-insensitive for city lookup keys', async () => {
    const prisma = makeMockPrisma();
    const cache = new CityCache(prisma);

    const id1 = await cache.getOrCreate('San Jose', 'CA');
    const id2 = await cache.getOrCreate('san jose', 'CA');

    expect(id1).toBe(id2);
    expect((prisma as ReturnType<typeof makeMockPrisma>)._upsertMock).toHaveBeenCalledTimes(1);
  });
});
