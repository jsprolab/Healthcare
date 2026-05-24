import type { PrismaClient } from '@prisma/client';
import { CityCache } from './CityCache';
import { ImportRunner } from './ImportRunner';
import { ProviderWriter } from './ProviderWriter';
import { RecordValidator } from './RecordValidator';
import { SpecialtyResolver } from './SpecialtyResolver';
import type { IImportLogger, ImportConfig } from './types';

/**
 * Wires all import dependencies and returns a ready-to-use ImportRunner.
 * Loads specialties from the DB and pre-warms the city cache during build.
 */
export async function createImportRunner(
  prisma: PrismaClient,
  config: Pick<ImportConfig, 'stateFilter'>,
  logger: IImportLogger = console
): Promise<ImportRunner> {
  logger.info('Loading specialties from database...');
  const specialtyResolver = new SpecialtyResolver(prisma);
  await specialtyResolver.loadSpecialties();
  logger.info(`  ${specialtyResolver.knownCodeCount} taxonomy codes mapped`);

  logger.info(`Pre-loading ${config.stateFilter} city cache...`);
  const cityCache = new CityCache(prisma);
  await cityCache.preload(config.stateFilter);

  const validator = new RecordValidator();
  const writer = new ProviderWriter(prisma, cityCache);

  return new ImportRunner(validator, specialtyResolver, writer, logger);
}
