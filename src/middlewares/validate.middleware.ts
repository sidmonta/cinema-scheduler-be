import type { NextFunction, Request, Response } from "express";
import { ZodType, ZodError } from "zod";
import { ValidationError } from "../config/app-error.js";


interface ParsedRequest {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export const validate = (schema: ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as ParsedRequest;

      // 1. Body e Params si possono riassegnare direttamente
      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params as never;

      // 2. req.query è un getter: va mutato con Object.assign invece di riassegnarlo!
      if (parsed.query) {
        // Svuota l'oggetto query originale preservandone il riferimento
        Object.keys(req.query).forEach((key) => delete (req.query as Record<string, unknown>)[key]);
        // Copia le proprietà parsate e trasformate da Zod dentro req.query
        Object.assign(req.query, parsed.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.').replace(/^(body|query|params)\./, ''),
          message: issue.message,
        }));

        throw new ValidationError('Errore di validazione dei dati di input', details);
      }
      next(error);
    }
  };
};