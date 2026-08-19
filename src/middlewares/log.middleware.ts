import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const log: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();
  res.on('finish', (): void => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    console.log(
      `[metrics] ${req.method} ${req.url ?? req.path} ${res.statusCode} - ${durationMs.toFixed(2)}ms`,
    );
  });
  next();
};
