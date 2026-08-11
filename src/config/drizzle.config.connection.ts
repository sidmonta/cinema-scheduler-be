import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema.js';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cinema_db';

// Inizializza il client postgres
const client = postgres(connectionString);

// Esporta l'istanza di Drizzle
export const db = drizzle(client, { schema });
