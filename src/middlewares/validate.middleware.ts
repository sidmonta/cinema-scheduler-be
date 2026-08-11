import type { NextFunction, Request, Response } from 'express';
import { ZodType, ZodError } from 'zod';
import { ValidationError } from '../config/app-error.js';

interface ParsedRequest {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export const validate = <T extends ZodType>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as ParsedRequest;

      // 1. Body e Params si possono riassegnare direttamente
      if (parsed.body) res.locals.body = parsed.body;
      if (parsed.params) res.locals.params = parsed.params;
      if (parsed.query) res.locals.query = parsed.query; // Salva la query validata in res.locals

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.').replace(/^(body|query|params)\./, ''),
          message: issue.message,
        }));

        return next(new ValidationError('Errore di validazione dei dati di input', details));
      }
      return next(error);
    }
  };
};
