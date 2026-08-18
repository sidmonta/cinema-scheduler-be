import type { Request, Response, NextFunction } from 'express';

export const log = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    console.log(
      `[metrics] ${req.method} ${req.url ?? req.path} ${res.statusCode} - ${durationMs.toFixed(2)}ms`,
    );
  });
  next();
};
