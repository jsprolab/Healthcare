import { ProviderService } from '@/services/providers';
import { NotFoundError } from '@/lib/errors';
import type { IProviderRepository } from '@/repositories/provider.repository';
import type { ProviderSearchParams } from '@/lib/schemas/provider.schema';
import type { ProviderWithRelations } from '@/lib/dtos/provider.dto';

function makeDefaultParams(overrides: Partial<ProviderSearchParams> = {}): ProviderSearchParams {
  return { page: 1, pageSize: 20, sortBy: 'lastName', sortOrder: 'asc', ...overrides };
}

function makeProviderRow(overrides: Partial<ProviderWithRelations> = {}): ProviderWithRelations {
  return {
    id: 'prov-1',
    npi: '1234567890',
    firstName: 'Jane',
    lastName: 'Smith',
    organizationName: null,
    taxonomyCode: '207Q00000X',
    address1: '123 Main St',
    address2: null,
    state: 'CA',
    zipCode: '94102',
    phone: '4155551234',
    latitude: null,
    longitude: null,
    specialtyId: 'sp-1',
    cityId: 'city-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    specialty: { id: 'sp-1', name: 'Family Medicine', slug: 'family-medicine', providers: [] },
    city: {
      id: 'city-1',
      name: 'San Francisco',
      state: 'CA',
      slug: 'san-francisco',
      providerCount: 0,
      providers: [],
    },
    ...overrides,
  } as unknown as ProviderWithRelations;
}

function makeMockRepository(
  overrides: Partial<IProviderRepository> = {}
): jest.Mocked<IProviderRepository> {
  return {
    search: jest.fn().mockResolvedValue({ providers: [], total: 0 }),
    findById: jest.fn().mockResolvedValue(null),
    ...overrides,
  } as jest.Mocked<IProviderRepository>;
}

describe('ProviderService', () => {
  describe('search', () => {
    it('returns a paginated response with mapped DTOs', async () => {
      const row = makeProviderRow();
      const repo = makeMockRepository({
        search: jest.fn().mockResolvedValue({ providers: [row], total: 1 }),
      });
      const service = new ProviderService(repo);
      const result = await service.search(makeDefaultParams());

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('prov-1');
      expect(result.data[0].displayName).toBe('Jane Smith');
    });

    it('computes totalPages correctly', async () => {
      const repo = makeMockRepository({
        search: jest.fn().mockResolvedValue({ providers: [], total: 95 }),
      });
      const service = new ProviderService(repo);
      const result = await service.search(makeDefaultParams({ pageSize: 20 }));
      expect(result.totalPages).toBe(5);
    });

    it('returns 1 totalPage when total is 0', async () => {
      const service = new ProviderService(makeMockRepository());
      const result = await service.search(makeDefaultParams());
      expect(result.totalPages).toBe(0);
    });

    it('formats phone number in the DTO', async () => {
      const row = makeProviderRow({ phone: '4155551234' });
      const repo = makeMockRepository({
        search: jest.fn().mockResolvedValue({ providers: [row], total: 1 }),
      });
      const service = new ProviderService(repo);
      const result = await service.search(makeDefaultParams());
      expect(result.data[0].phoneFormatted).toBe('(415) 555-1234');
    });

    it('sets isOrganization true for org records', async () => {
      const row = makeProviderRow({
        organizationName: 'UCSF Medical Center',
        firstName: null,
        lastName: null,
      });
      const repo = makeMockRepository({
        search: jest.fn().mockResolvedValue({ providers: [row], total: 1 }),
      });
      const service = new ProviderService(repo);
      const result = await service.search(makeDefaultParams());
      expect(result.data[0].isOrganization).toBe(true);
      expect(result.data[0].displayName).toBe('UCSF Medical Center');
    });

    it('delegates to the repository with the given params', async () => {
      const repo = makeMockRepository();
      const service = new ProviderService(repo);
      const params = makeDefaultParams({ specialty: 'cardiology', page: 2 });
      await service.search(params);
      expect(repo.search).toHaveBeenCalledWith(params);
    });
  });

  describe('getById', () => {
    it('returns the DTO when the provider is found', async () => {
      const row = makeProviderRow();
      const repo = makeMockRepository({ findById: jest.fn().mockResolvedValue(row) });
      const service = new ProviderService(repo);
      const result = await service.getById('prov-1');
      expect(result.id).toBe('prov-1');
    });

    it('throws NotFoundError when the provider does not exist', async () => {
      const service = new ProviderService(makeMockRepository());
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError with the correct message', async () => {
      const service = new ProviderService(makeMockRepository());
      await expect(service.getById('x')).rejects.toThrow('Provider not found');
    });
  });
});
