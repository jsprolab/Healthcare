import type { ApiResponse } from '@/types';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation error') {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export function handleApiError(error: unknown): {
  status: number;
  body: ApiResponse<never>;
} {
  if (error instanceof ApiError) {
    return { status: error.statusCode, body: { success: false, error: error.message } };
  }
  console.error('[handleApiError]', error);
  return { status: 500, body: { success: false, error: 'Internal server error' } };
}
