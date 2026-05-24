/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/providers/route';
import { ProviderService } from '@/services/providers';

jest.mock('@/lib/prisma', () => ({ prisma: {} }));
jest.mock('@/repositories/provider.repository', () => ({
  PrismaProviderRepository: jest.fn(),
}));
jest.mock('@/services/providers');

const MockProviderService = ProviderService as jest.MockedClass<typeof ProviderService>;

function makeUrl(query: Record<string, string> = {}): string {
  const params = new URLSearchParams(query);
  return `http://localhost/api/providers?${params.toString()}`;
}

const emptyPage = { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };

describe('GET /api/providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with paginated results for valid params', async () => {
    MockProviderService.prototype.search = jest.fn().mockResolvedValue(emptyPage);

    const response = await GET(new NextRequest(makeUrl()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(emptyPage);
  });

  it('returns 400 for an invalid zipCode', async () => {
    const response = await GET(new NextRequest(makeUrl({ zipCode: 'BADZIP' })));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/zipCode/i);
  });

  it('returns 400 for a state longer than 2 chars', async () => {
    const response = await GET(new NextRequest(makeUrl({ state: 'CAL' })));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for page=0', async () => {
    const response = await GET(new NextRequest(makeUrl({ page: '0' })));
    expect(response.status).toBe(400);
  });

  it('passes validated params to the service', async () => {
    const mockSearch = jest.fn().mockResolvedValue(emptyPage);
    MockProviderService.prototype.search = mockSearch;

    await GET(new NextRequest(makeUrl({ specialty: 'cardiology', page: '2', pageSize: '10' })));

    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ specialty: 'cardiology', page: 2, pageSize: 10 })
    );
  });

  it('returns 500 when the service throws an unexpected error', async () => {
    MockProviderService.prototype.search = jest.fn().mockRejectedValue(new Error('db down'));

    const response = await GET(new NextRequest(makeUrl()));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });
});
