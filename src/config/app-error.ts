// Base AppError
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 Not Found Error
export class NotFoundError extends AppError {
  constructor(message: string = 'Risorsa non trovata', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

// 400 Validation Error
export class ValidationError extends AppError {
  constructor(message: string = 'Errore di validazione dati', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

// 403 Forbidden Error
export class ForbiddenError extends AppError {
  constructor(message: string = 'Accesso vietato', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

// 401 Unauthorized Error
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Non autorizzato', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

// 409 Conflict Error
export class ConflictError extends AppError {
  constructor(message: string = 'Conflitto di dati', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}
