import type { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../config/app-error.js';

export const notFoundHandler = (req: Request, _res: Response, _next: NextFunction) => {
  throw new NotFoundError(`Impossibile trovare la rotta ${req.originalUrl} su questo server`);
};
