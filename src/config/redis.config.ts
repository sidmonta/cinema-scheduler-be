import { Redis } from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

export const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => {
  console.log('Connesso a Redis con successo');
});

redisClient.on('error', (err) => {
  console.error('Errore di connessione Redis', err);
});
