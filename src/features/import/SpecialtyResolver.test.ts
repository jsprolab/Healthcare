import { SpecialtyResolver } from './SpecialtyResolver';
import type { PrismaClient } from '@prisma/client';
import type { NppesTaxonomy } from './types';

function makeMockPrisma(specialties: Array<{ id: string; slug: string; name: string }>) {
  return {
    specialty: {
      findMany: jest.fn().mockResolvedValue(specialties),
    },
  } as unknown as PrismaClient;
}

const SEED_SPECIALTIES = [
  { id: 'sp-1', slug: 'family-medicine', name: 'Family Medicine' },
  { id: 'sp-2', slug: 'cardiology', name: 'Cardiology' },
  { id: 'sp-3', slug: 'dermatology', name: 'Dermatology' },
];

describe('SpecialtyResolver', () => {
  let resolver: SpecialtyResolver;

  beforeEach(async () => {
    resolver = new SpecialtyResolver(makeMockPrisma(SEED_SPECIALTIES));
    await resolver.loadSpecialties();
  });

  it('resolves a known primary taxonomy code to the correct specialty id', () => {
    const taxonomies: NppesTaxonomy[] = [{ code: '207Q00000X', isPrimary: true }];
    expect(resolver.resolve(taxonomies)).toBe('sp-1');
  });

  it('resolves a known non-primary code when it is the only entry', () => {
    const taxonomies: NppesTaxonomy[] = [{ code: '207Q00000X', isPrimary: false }];
    expect(resolver.resolve(taxonomies)).toBe('sp-1');
  });

  it('prefers a primary-marked code over an earlier non-primary code', () => {
    const taxonomies: NppesTaxonomy[] = [
      { code: '207N00000X', isPrimary: false }, // dermatology
      { code: '207Q00000X', isPrimary: true }, // family-medicine (primary)
    ];
    expect(resolver.resolve(taxonomies)).toBe('sp-1');
  });

  it('returns null for an unknown taxonomy code', () => {
    const taxonomies: NppesTaxonomy[] = [{ code: '999X99999X', isPrimary: true }];
    expect(resolver.resolve(taxonomies)).toBeNull();
  });

  it('returns null for an empty taxonomy list', () => {
    expect(resolver.resolve([])).toBeNull();
  });

  it('returns null when the taxonomy slug is not in the DB', () => {
    // '207RC0000X' maps to 'cardiology', but cardiology id is 'sp-2' — should resolve
    const taxonomies: NppesTaxonomy[] = [{ code: '207RC0000X', isPrimary: true }];
    expect(resolver.resolve(taxonomies)).toBe('sp-2');
  });

  it('returns null when the matched slug has no corresponding DB row', () => {
    // Use a prisma mock that has no specialties
    const emptyResolver = new SpecialtyResolver(makeMockPrisma([]));
    return emptyResolver.loadSpecialties().then(() => {
      const taxonomies: NppesTaxonomy[] = [{ code: '207Q00000X', isPrimary: true }];
      expect(emptyResolver.resolve(taxonomies)).toBeNull();
    });
  });

  it('throws if resolve() is called before loadSpecialties()', () => {
    const unloaded = new SpecialtyResolver(makeMockPrisma(SEED_SPECIALTIES));
    expect(() => unloaded.resolve([])).toThrow('loadSpecialties');
  });
});
