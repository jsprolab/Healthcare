import type { PrismaClient } from '@prisma/client';
import type { ISpecialtyResolver, NppesTaxonomy } from './types';
import { TAXONOMY_SLUG_MAP, resolveSlugFromTaxonomies } from './taxonomy-map';

/**
 * Maps NUCC taxonomy entries to a specialty DB id.
 * Loads all specialties from the DB once and keeps them in memory.
 */
export class SpecialtyResolver implements ISpecialtyResolver {
  /** slug → DB id */
  private readonly slugToId = new Map<string, string>();
  private loaded = false;

  constructor(private readonly prisma: PrismaClient) {}

  async loadSpecialties(): Promise<void> {
    const specialties = await this.prisma.specialty.findMany();
    for (const s of specialties) {
      this.slugToId.set(s.slug, s.id);
    }
    this.loaded = true;
  }

  resolve(taxonomies: NppesTaxonomy[]): string | null {
    if (!this.loaded) {
      throw new Error('SpecialtyResolver: call loadSpecialties() before resolve()');
    }
    const slug = resolveSlugFromTaxonomies(taxonomies);
    if (!slug) return null;
    return this.slugToId.get(slug) ?? null;
  }

  /** Returns the total number of known taxonomy codes for diagnostics. */
  get knownCodeCount(): number {
    return Object.keys(TAXONOMY_SLUG_MAP).length;
  }
}
