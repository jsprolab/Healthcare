/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/providers/[id]/route';
import { ProviderService } from '@/services/providers';
import { NotFoundError } from '@/lib/errors';
import type { ProviderResponseDto } from '@/lib/dtos/provider.dto';

jest.mock('@/lib/prisma', () => ({ prisma: {} }));
jest.mock('@/repositories/provider.repository', () => ({
  PrismaProviderRepository: jest.fn(),
}));
jest.mock('@/services/providers');

const MockProviderService = ProviderService as jest.MockedClass<typeof ProviderService>;

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

const fakeProvider: ProviderResponseDto = {
  id: 'prov-abc',
  npi: '1234567890',
  displayName: 'Jane Smith',
  isOrganization: false,
  taxonomyCode: '207Q00000X',
  address1: '123 Main St',
  address2: null,
  state: 'CA',
  zipCode: '94102',
  phoneFormatted: '(415) 555-1234',
  coordinates: null,
  specialty: null,
  city: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('GET /api/providers/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with the provider DTO', async () => {
    MockProviderService.prototype.getById = jest.fn().mockResolvedValue(fakeProvider);

    const response = await GET(
      new NextRequest('http://localhost/api/providers/prov-abc'),
      makeContext('prov-abc')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('prov-abc');
  });

  it('returns 404 when the provider does not exist', async () => {
    MockProviderService.prototype.getById = jest
      .fn()
      .mockRejectedValue(new NotFoundError('Provider not found'));

    const response = await GET(
      new NextRequest('http://localhost/api/providers/missing'),
      makeContext('missing')
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Provider not found');
  });

  it('returns 400 for an empty id', async () => {
    const response = await GET(new NextRequest('http://localhost/api/providers/'), makeContext(''));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 500 when the service throws an unexpected error', async () => {
    MockProviderService.prototype.getById = jest
      .fn()
      .mockRejectedValue(new Error('db connection lost'));

    const response = await GET(
      new NextRequest('http://localhost/api/providers/prov-xyz'),
      makeContext('prov-xyz')
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });

  it('calls getById with the route id', async () => {
    const mockGetById = jest.fn().mockResolvedValue(fakeProvider);
    MockProviderService.prototype.getById = mockGetById;

    await GET(new NextRequest('http://localhost/api/providers/prov-abc'), makeContext('prov-abc'));

    expect(mockGetById).toHaveBeenCalledWith('prov-abc');
  });
});
