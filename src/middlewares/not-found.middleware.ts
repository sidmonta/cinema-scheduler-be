import type { Request } from 'express';
import { NotFoundError } from '../config/app-error.js';

export const notFoundHandler = (req: Request): Promise<void> => {
  throw new NotFoundError(`Impossibile trovare la rotta ${req.originalUrl} su questo server`);
};
