import { redisClient } from "../config/redis.config.js";

// TTL di default configurabile (es. 5 minuti = 300 secondi)
export const PALINSESTO_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 300;

/**
 * Costruisce la chiave Redis secondo la convenzione documentata.
 */
export const buildPalinsestoCacheKey = (data: string): string => {
  return `palinsesto:${data}`;
};

/**
 * Invalida esplicitamente la cache per una specifica accoppiata cinema + data.
 */
export const invalidatePalinsestoCache = async (data: string): Promise<void> => {
  const cacheKey = buildPalinsestoCacheKey(data);
  await redisClient.del(cacheKey);
};