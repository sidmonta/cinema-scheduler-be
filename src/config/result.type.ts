import type { AppError } from './app-error.js';

export type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

export const ok = <T, E = AppError>(data: T): Result<T, E> => ({
  success: true,
  data,
});

export const err = <E = AppError, T = never>(error: E): Result<T, E> => ({
  success: false,
  error,
});
