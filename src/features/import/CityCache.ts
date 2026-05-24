import type { PrismaClient } from '@prisma/client';
import type { ICityCache } from './types';
import { toSlug } from '@/utils';

/**
 * In-memory cache for city lookups backed by Prisma upserts.
 *
 * Concurrent calls for the same key share one in-flight Promise, so the DB
 * upsert fires exactly once per unique city — even under concurrent async calls.
 */
export class CityCache implements ICityCache {
  /** "cityname|state" (lowercase) → resolved city id */
  private readonly resolved = new Map<string, string>();
  /** "cityname|state" → in-flight upsert Promise */
  private readonly inflight = new Map<string, Promise<string>>();

  constructor(private readonly prisma: PrismaClient) {}

  /** Pre-populate cache from existing cities in the DB for a given state. */
  async preload(state: string): Promise<void> {
    const cities = await this.prisma.city.findMany({ where: { state } });
    for (const city of cities) {
      this.resolved.set(this.cacheKey(city.name, city.state), city.id);
    }
  }

  async getOrCreate(cityName: string, state: string): Promise<string> {
    const key = this.cacheKey(cityName, state);

    // Fast path: already resolved
    const hit = this.resolved.get(key);
    if (hit) return hit;

    // Deduplicate concurrent requests for the same city
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = this.upsertCity(cityName, state).then((id) => {
      this.resolved.set(key, id);
      this.inflight.delete(key);
      return id;
    });

    this.inflight.set(key, promise);
    return promise;
  }

  private async upsertCity(cityName: string, state: string): Promise<string> {
    const slug = `${toSlug(cityName)}-${state.toLowerCase()}`;
    const city = await this.prisma.city.upsert({
      where: { slug },
      update: {},
      create: { name: cityName, state: state.toUpperCase(), slug },
    });
    return city.id;
  }

  private cacheKey(cityName: string, state: string): string {
    return `${cityName.toLowerCase()}|${state.toLowerCase()}`;
  }
}
