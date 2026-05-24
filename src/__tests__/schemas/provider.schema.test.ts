import { ProviderSearchSchema, ProviderIdSchema } from '@/lib/schemas/provider.schema';

describe('ProviderSearchSchema', () => {
  it('parses empty input with defaults', () => {
    const result = ProviderSearchSchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      page: 1,
      pageSize: 20,
      sortBy: 'lastName',
      sortOrder: 'asc',
    });
  });

  it('accepts valid search params', () => {
    const result = ProviderSearchSchema.safeParse({
      city: 'san-francisco',
      specialty: 'family-medicine',
      zipCode: '94102',
      state: 'ca',
      page: '2',
      pageSize: '50',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.state).toBe('CA');
    expect(result.data.page).toBe(2);
    expect(result.data.pageSize).toBe(50);
  });

  it('accepts ZIP+4 format', () => {
    const result = ProviderSearchSchema.safeParse({ zipCode: '94102-1234' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid zipCode', () => {
    const result = ProviderSearchSchema.safeParse({ zipCode: 'ABCDE' });
    expect(result.success).toBe(false);
  });

  it('rejects state longer than 2 characters', () => {
    const result = ProviderSearchSchema.safeParse({ state: 'CAL' });
    expect(result.success).toBe(false);
  });

  it('rejects page < 1', () => {
    const result = ProviderSearchSchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects pageSize > 100', () => {
    const result = ProviderSearchSchema.safeParse({ pageSize: '101' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown sortBy value', () => {
    const result = ProviderSearchSchema.safeParse({ sortBy: 'npi' });
    expect(result.success).toBe(false);
  });

  it('uppercases state', () => {
    const result = ProviderSearchSchema.safeParse({ state: 'ca' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.state).toBe('CA');
  });

  it('trims whitespace from city', () => {
    const result = ProviderSearchSchema.safeParse({ city: '  los-angeles  ' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.city).toBe('los-angeles');
  });
});

describe('ProviderIdSchema', () => {
  it('accepts a non-empty string', () => {
    const result = ProviderIdSchema.safeParse('some-id-123');
    expect(result.success).toBe(true);
  });

  it('rejects an empty string', () => {
    const result = ProviderIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});
