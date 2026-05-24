import type { IProviderRepository } from '@/repositories/provider.repository';
import type { ProviderSearchParams } from '@/lib/schemas/provider.schema';
import { toProviderDto, type ProviderResponseDto } from '@/lib/dtos/provider.dto';
import { NotFoundError } from '@/lib/errors';

export interface PaginatedProviderResponse {
  data: ProviderResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class ProviderService {
  constructor(private readonly repository: IProviderRepository) {}

  async search(params: ProviderSearchParams): Promise<PaginatedProviderResponse> {
    const { providers, total } = await this.repository.search(params);
    return {
      data: providers.map(toProviderDto),
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
    };
  }

  async getById(id: string): Promise<ProviderResponseDto> {
    const provider = await this.repository.findById(id);
    if (!provider) throw new NotFoundError('Provider not found');
    return toProviderDto(provider);
  }
}
