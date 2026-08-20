import { vi } from 'vitest';

export const redisClient = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};
