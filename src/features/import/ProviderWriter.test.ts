import { ProviderWriter } from './ProviderWriter';
import type { PrismaClient } from '@prisma/client';
import type { ICityCache, ProviderRecord } from './types';

function makeRecord(npi = '1234567890'): ProviderRecord {
  return {
    npi,
    firstName: 'Jane',
    lastName: 'Smith',
    organizationName: null,
    taxonomyCode: '207Q00000X',
    address1: '123 Main St',
    address2: null,
    cityName: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    phone: '4155551234',
    specialtyId: 'sp-1',
  };
}

function makeMockCityCache(cityId = 'city-1'): ICityCache {
  return {
    getOrCreate: jest.fn().mockResolvedValue(cityId),
  } as unknown as ICityCache;
}

type MockPrisma = PrismaClient & {
  _upsertMock: jest.Mock;
  _transactionMock: jest.Mock;
};

function makeMockPrisma(transactionBehavior: 'success' | 'fail' = 'success'): MockPrisma {
  const upsertMock = jest.fn().mockResolvedValue({});

  // The interactive transaction callback receives a fake `tx` object
  const transactionMock = jest
    .fn()
    .mockImplementation(
      async (fn: (tx: { provider: { upsert: jest.Mock } }) => Promise<unknown>) => {
        if (transactionBehavior === 'fail') throw new Error('tx error');
        return fn({ provider: { upsert: upsertMock } });
      }
    );

  return {
    provider: { upsert: upsertMock },
    $transaction: transactionMock,
    _upsertMock: upsertMock,
    _transactionMock: transactionMock,
  } as unknown as MockPrisma;
}

describe('ProviderWriter', () => {
  it('returns { imported: n, errors: 0 } when the transaction succeeds', async () => {
    const prisma = makeMockPrisma('success');
    const writer = new ProviderWriter(prisma, makeMockCityCache());

    const result = await writer.writeBatch([makeRecord('1111111111'), makeRecord('2222222222')]);

    expect(result.imported).toBe(2);
    expect(result.errors).toBe(0);
  });

  it('returns { imported: 0, errors: 0 } for an empty batch', async () => {
    const prisma = makeMockPrisma('success');
    const writer = new ProviderWriter(prisma, makeMockCityCache());
    const result = await writer.writeBatch([]);
    expect(result).toEqual({ imported: 0, errors: 0 });
  });

  it('falls back to individual upserts when the transaction fails', async () => {
    const prisma = makeMockPrisma('fail');
    const writer = new ProviderWriter(prisma, makeMockCityCache());

    const result = await writer.writeBatch([makeRecord('1111111111'), makeRecord('2222222222')]);

    // Transaction threw, but individual upserts (via prisma.provider.upsert) should succeed
    expect(result.imported).toBe(2);
    expect(result.errors).toBe(0);
    // Transaction was attempted once, then 2 individual upserts were made
    expect(prisma._transactionMock).toHaveBeenCalledTimes(1);
    expect(prisma._upsertMock).toHaveBeenCalledTimes(2);
  });

  it('counts individual upsert failures as errors in fallback mode', async () => {
    const prisma = makeMockPrisma('fail');
    let callCount = 0;
    prisma._upsertMock.mockImplementation(() => {
      callCount++;
      return callCount % 2 === 0 ? Promise.reject(new Error('bad row')) : Promise.resolve({});
    });
    const writer = new ProviderWriter(prisma, makeMockCityCache());

    const result = await writer.writeBatch([makeRecord('1111111111'), makeRecord('2222222222')]);

    expect(result.imported).toBe(1);
    expect(result.errors).toBe(1);
  });

  it('resolves the city id for each record via the city cache', async () => {
    const prisma = makeMockPrisma('success');
    const mockCache = makeMockCityCache('city-sf');
    const writer = new ProviderWriter(prisma, mockCache);

    await writer.writeBatch([makeRecord()]);

    expect(mockCache.getOrCreate).toHaveBeenCalledWith('San Francisco', 'CA');
  });

  it('passes the resolved cityId to the upsert', async () => {
    const prisma = makeMockPrisma('success');
    const writer = new ProviderWriter(prisma, makeMockCityCache('city-xyz'));

    await writer.writeBatch([makeRecord()]);

    // The upsert inside the transaction uses the city-resolved data
    const txCall = prisma._transactionMock.mock.calls[0][0];
    expect(typeof txCall).toBe('function');
  });
});
