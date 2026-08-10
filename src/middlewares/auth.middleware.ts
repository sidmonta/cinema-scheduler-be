import type { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import type { JwtPayload, RuoloType } from "../config/jwt.config.js";


const JWT_SECRET = process.env.JWT_SECRET || 'secrettokenjwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token di autenticazione mancante o non valido.' },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded; // Agganciamo l'utente alla richiesta
    next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token scaduto o non valido.' },
    });
  }
};

export const authorize = (...allowedRoles: RuoloType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Utente non autenticato.' },
      });
    }

    if (!allowedRoles.includes(req.user.ruolo)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Non disponi dei permessi necessari per accedere a questa risorsa.' },
      });
    }

    next();
  };
};