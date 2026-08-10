import type { ruoloEnum } from "../db/schema.js";

export type RuoloType = (typeof ruoloEnum.enumValues)[number]; // 'ADMIN' | 'USER'

export interface JwtPayload {
    sub: string,
    email: string,
    ruolo: RuoloType
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

