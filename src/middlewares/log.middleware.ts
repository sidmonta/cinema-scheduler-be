import type { Request, Response, NextFunction } from "express";

export const log = (req: Request, _res: Response, next: NextFunction) => {
    console.log("Chiamata in entrata", req.url);
    const start = performance.now();
    next();
    console.log("Chiamata conclusa", performance.now() - start);
}
