import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  cinema,
  sala,
  film,
  proiezione,
  utente,
  prenotazione,
  posto,
} from '../src/db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INIT_DATA_DIR = resolve(__dirname, '..', 'init-data');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/cinema';

const client = postgres(DATABASE_URL);
const db = drizzle(client);

// UUID v5-like deterministic generation using a project namespace
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // RFC 4122 DNS namespace

function deterministicUUID(entityType: string, id: number): string {
  const hash = createHash('sha256')
    .update(`${NAMESPACE}:${entityType}:${id}`)
    .digest();
  const bytes = hash.subarray(0, 16);
  // Set version 5 (0101) and variant 10xx
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

function parseCSV(filename: string): string[][] {
  const content = readFileSync(resolve(INIT_DATA_DIR, filename), 'utf-8');
  const lines = content.trim().split('\n');
  return lines.map((line) => line.split(','));
}

function toOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

// Mappature enum
const RUOLO_MAP: Record<string, 'ADMIN' | 'USER'> = {
  admin: 'ADMIN',
  customer: 'USER',
};

const STATO_MAP: Record<string, 'CONFIRMED' | 'PENDING' | 'CANCELLED'> = {
  confirmed: 'CONFIRMED',
  pending: 'PENDING',
  cancelled: 'CANCELLED',
};

async function seed() {
  console.log('Seeding database...');

  // 1. Cinema
  const cinemaRows = parseCSV('cinema.csv').slice(1); // skip header
  const cinemaIdMap = new Map<number, string>();
  for (const row of cinemaRows) {
    const [id, nome, indirizzo, citta, telefono] = row;
    const numericId = Number(id);
    const uuid = deterministicUUID('cinema', numericId);
    cinemaIdMap.set(numericId, uuid);
    await db.insert(cinema).values({
      id: uuid,
      nome: nome!,
      indirizzo: indirizzo!,
      citta: citta!,
      telefono: telefono!,
    });
  }
  console.log(`  Inserted ${cinemaRows.length} cinemas`);

  // 2. Sala
  const salaRows = parseCSV('sale.csv').slice(1);
  const salaIdMap = new Map<number, string>();
  for (const row of salaRows) {
    const [id, cinemaId, nome, righe, colonne] = row;
    const numericId = Number(id);
    const uuid = deterministicUUID('sala', numericId);
    salaIdMap.set(numericId, uuid);
    await db.insert(sala).values({
      id: uuid,
      cinema_id: cinemaIdMap.get(Number(cinemaId))!,
      nome: nome!,
      righe: Number(righe),
      colonne: Number(colonne),
      // capienza is generatedAlwaysAs, skip it
    });
  }
  console.log(`  Inserted ${salaRows.length} sale`);

  // 3. Film
  const filmRows = parseCSV('film.csv').slice(1);
  const filmIdMap = new Map<number, string>();
  for (const row of filmRows) {
    const [id, titolo, durataMinuti, genere, classificazione] = row;
    const numericId = Number(id);
    const uuid = deterministicUUID('film', numericId);
    filmIdMap.set(numericId, uuid);
    await db.insert(film).values({
      id: uuid,
      titolo: titolo!,
      durata_minuti: Number(durataMinuti),
      genere: genere!,
      classificazione:
        classificazione as (typeof film)['classificazione']['enumValues'][number],
    });
  }
  console.log(`  Inserted ${filmRows.length} films`);

  // 4. Utente
  const utenteRows = parseCSV('utenti.csv').slice(1);
  const utenteIdMap = new Map<number, string>();
  for (const row of utenteRows) {
    const [id, email, nome, cognome, ruolo, passwordHash] = row;
    const numericId = Number(id);
    const uuid = deterministicUUID('utente', numericId);
    utenteIdMap.set(numericId, uuid);
    await db.insert(utente).values({
      id: uuid,
      email: email!,
      nome: nome!,
      cognome: cognome!,
      ruolo: RUOLO_MAP[ruolo!] ?? 'USER',
      password: passwordHash!,
    });
  }
  console.log(`  Inserted ${utenteRows.length} utenti`);

  // 5. Proiezione
  const proiezioneRows = parseCSV('proiezioni.csv').slice(1);
  const proiezioneIdMap = new Map<number, string>();
  for (const row of proiezioneRows) {
    const [id, filmId, salaId, dataInizio, dataFine] = row;
    const numericId = Number(id);
    const uuid = deterministicUUID('proiezione', numericId);
    proiezioneIdMap.set(numericId, uuid);
    await db.insert(proiezione).values({
      id: uuid,
      film_id: filmIdMap.get(Number(filmId))!,
      sala_id: salaIdMap.get(Number(salaId))!,
      data_ora_inizio: new Date(dataInizio!),
      data_ora_fine: new Date(dataFine!),
    });
  }
  console.log(`  Inserted ${proiezioneRows.length} proiezioni`);

  // 6. Prenotazione
  const prenotazioneRows = parseCSV('prenotazioni.csv').slice(1);
  const prenotazioneIdMap = new Map<number, string>();
  for (const row of prenotazioneRows) {
    const [id, proiezioneId, utenteId, stato, createdAt] = row;
    const numericId = Number(id);
    const uuid = deterministicUUID('prenotazione', numericId);
    prenotazioneIdMap.set(numericId, uuid);
    await db.insert(prenotazione).values({
      id: uuid,
      proiezione_id: proiezioneIdMap.get(Number(proiezioneId))!,
      utente_id: utenteIdMap.get(Number(utenteId))!,
      stato: STATO_MAP[stato!] ?? 'PENDING',
      ...(createdAt ? { creata_il: new Date(createdAt) } : {}),
    });
  }
  console.log(`  Inserted ${prenotazioneRows.length} prenotazioni`);

  // 7. Posto
  const postoRows = parseCSV('posti_prenotati.csv').slice(1);
  for (const row of postoRows) {
    const [id, prenotazioneId, riga, colonna] = row;
    await db.insert(posto).values({
      prenotazione_id: prenotazioneIdMap.get(Number(prenotazioneId))!,
      riga: Number(riga),
      colonna: Number(colonna),
    });
  }
  console.log(`  Inserted ${postoRows.length} posti`);

  console.log('Seed completed successfully!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
