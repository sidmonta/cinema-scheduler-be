import type { AppError } from "./app-error.js";

export type Result<T, E = AppError> = 
| { success: true; data: T }
| { success: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({ 
    success: true,
    data
});

export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});