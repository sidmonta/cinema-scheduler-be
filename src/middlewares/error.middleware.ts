import type { ErrorRequestHandler } from "express";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../config/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  console.error(" Errore Non Gestito:", err);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Si è verificato un errore interno del server",
    },
  });
};
