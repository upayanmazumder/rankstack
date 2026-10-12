import { isAxiosError } from 'axios';
import { ZodError } from 'zod';

import type { ApiErrorData } from '@/types';

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor({ message, status, code, details }: ApiErrorData) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function responseMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const body = data as Record<string, unknown>;

  if (typeof body.detail === 'string' && body.detail) return body.detail;

  if (Array.isArray(body.detail)) {
    const first: unknown = body.detail[0];
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      const issue = first as Record<string, unknown>;
      if (typeof issue.msg === 'string') {
        const location = Array.isArray(issue.loc)
          ? issue.loc
              .filter(
                (part): part is string | number =>
                  typeof part === 'string' || typeof part === 'number'
              )
              .filter(part => part !== 'body')
              .join('.')
          : '';
        return location ? `${location}: ${issue.msg}` : issue.msg;
      }
    }
  }

  return typeof body.message === 'string' ? body.message : undefined;
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data: unknown = error.response?.data;
    const body =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : undefined;
    return new ApiError({
      message: responseMessage(data) ?? error.message,
      status,
      code: typeof body?.code === 'string' ? body.code : undefined,
      details: data,
    });
  }

  if (error instanceof ZodError) {
    return new ApiError({
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.issues,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ message: error.message });
  }

  return new ApiError({ message: 'An unexpected error occurred' });
}
