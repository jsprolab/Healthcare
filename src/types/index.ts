export type { Provider, Specialty, City, Prisma } from '@prisma/client';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProviderSearchParams extends PaginationParams {
  specialty?: string;
  city?: string;
  state?: string;
  name?: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
