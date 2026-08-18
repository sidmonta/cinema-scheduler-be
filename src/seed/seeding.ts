import fs from 'node:fs';
import path from 'node:path';
import csv from 'csv-parser';
import { sql } from 'drizzle-orm';
import { cinema, sala, film, proiezione, utente, prenotazione, posto } from '../db/schema.js';
import { db } from '../config/drizzle.config.connection.js';

function readCsv<T = any>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File non trovato: ${filePath}`));
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function runCsvSeed() {
  console.log('1. Pulizia tabelle...');
  await db.execute(
    sql`TRUNCATE TABLE posto, prenotazione, proiezione, utente, film, sala, cinema RESTART IDENTITY CASCADE;`,
  );

  const initDataDir = path.join(process.cwd(), 'init-data');
  console.log(`2. Caricamento CSV e generazione automatica UUID...\n`);

  const cinemaMap = new Map<string, string>();
  const salaMap = new Map<string, string>();
  const filmMap = new Map<string, string>();
  const utenteMap = new Map<string, string>();
  const proiezioneMap = new Map<string, string>();
  const prenotazioneMap = new Map<string, string>();

  // --- A. CINEMA ---
  const cinemaData = await readCsv(path.join(initDataDir, 'cinema.csv'));
  for (const row of cinemaData) {
    const [inserted] = await db
      .insert(cinema)
      .values({
        nome: row.nome,
        indirizzo: row.indirizzo,
        citta: row.citta,
        telefono: row.telefono,
      })
      .returning();

    if (row.id) cinemaMap.set(String(row.id), inserted.id);
  }
  console.log(`Inseriti ${cinemaData.length} record in 'cinema'`);

  // --- B. SALE ---
  const saleData = await readCsv(path.join(initDataDir, 'sale.csv'));
  for (const row of saleData) {
    const [inserted] = await db
      .insert(sala)
      .values({
        cinema_id: cinemaMap.get(String(row.cinema_id ?? row.cinemaId))!,
        nome: row.nome,
        righe: Number(row.righe),
        colonne: Number(row.colonne),
      })
      .returning();

    if (row.id) salaMap.set(String(row.id), inserted.id);
  }
  console.log(`Inseriti ${saleData.length} record in 'sala'`);

  // --- C. FILM ---
  const filmData = await readCsv(path.join(initDataDir, 'film.csv'));
  for (const row of filmData) {
    const [inserted] = await db
      .insert(film)
      .values({
        titolo: row.titolo,
        durata_minuti: Number(row.durata_minuti ?? row.durataMinuti),
        genere: row.genere,
        classificazione: row.classificazione,
      })
      .returning();

    if (row.id) filmMap.set(String(row.id), inserted.id);
  }
  console.log(`Inseriti ${filmData.length} record in 'film'`);

  // --- D. UTENTI ---
  const utenteData = await readCsv(path.join(initDataDir, 'utenti.csv'));
  for (const row of utenteData) {
    const [inserted] = await db
      .insert(utente)
      .values({
        nome: row.nome,
        cognome: row.cognome,
        email: row.email,
        password: row.password,
        ruolo: row.ruolo,
      })
      .returning();

    if (row.id) utenteMap.set(String(row.id), inserted.id);
  }
  console.log(`Inseriti ${utenteData.length} record in 'utente'`);

  // --- E. PROIEZIONI ---
  const proiezioneData = await readCsv(path.join(initDataDir, 'proiezioni_v2.csv'));

  // Manteniamo anche il vecchio ID CSV per popolare la Map dopo l'inserimento
  const proiezioniToInsert = proiezioneData
    .map((row) => {
      const filmId = filmMap.get(String(row.film_id ?? row.filmId));
      const salaId = salaMap.get(String(row.sala_id ?? row.salaId));
      if (!filmId || !salaId) return undefined;

      return {
        csvId: String(row.id),
        data: {
          film_id: filmId,
          sala_id: salaId,
          data_ora_inizio: new Date(row.data_ora_inizio),
          data_ora_fine: new Date(row.data_ora_fine),
        },
      };
    })
    .filter(Boolean);

  const proiezioneChunks = chunkArray(proiezioniToInsert, 1000);
  let totalProiezioniInserted = 0;

  for (const chunk of proiezioneChunks) {
    const valuesToInsert = chunk.map((c) => c!.data);
    const insertedRecords = await db
      .insert(proiezione)
      .values(valuesToInsert)
      .onConflictDoNothing()
      .returning();

    // MAPPIAMO L'ID CSV CON L'UUID GENERATO DAL DB
    insertedRecords.forEach((inserted, index) => {
      const originalCsvId = chunk[index]!.csvId;
      proiezioneMap.set(originalCsvId, inserted.id);
    });

    totalProiezioniInserted += insertedRecords.length;
  }
  console.log(`Inseriti ${totalProiezioniInserted} record in 'proiezione'`);

  // --- F. PRENOTAZIONI ---
  const prenotazioneData = await readCsv(path.join(initDataDir, 'prenotazioni_v2.csv'));

  const prenotazioniToInsert = prenotazioneData
    .map((row) => {
      const utenteId = utenteMap.get(String(row.utente_id ?? row.utenteId));
      const proiezioneId = proiezioneMap.get(String(row.proiezione_id ?? row.proiezioneId));

      if (!utenteId || !proiezioneId) return undefined;

      return {
        csvId: String(row.id),
        data: {
          utente_id: utenteId,
          proiezione_id: proiezioneId,
          riga: Number(row.riga),
          colonna: Number(row.colonna),
          stato: row.stato ?? 'CONFIRMED',
        },
      };
    })
    .filter(Boolean);

  // Usiamo un chunk size di 2000 per bilanciare velocità e limite parametri Postgres
  const prenotazioneChunks = chunkArray(prenotazioniToInsert, 2000);
  let totalPrenotazioniInserted = 0;

  for (const chunk of prenotazioneChunks) {
    const valuesToInsert = chunk.map((c) => c!.data);
    const insertedRecords = await db
      .insert(prenotazione)
      .values(valuesToInsert)
      .onConflictDoNothing()
      .returning();

    // MAPPIAMO L'ID CSV CON L'UUID GENERATO DAL DB (se ti serve per 'posto')
    insertedRecords.forEach((inserted, index) => {
      const originalCsvId = chunk[index]!.csvId;
      prenotazioneMap.set(originalCsvId, inserted.id);
    });

    totalPrenotazioniInserted += insertedRecords.length;
    console.log(
      `... progress: inseriti ${totalPrenotazioniInserted} / ${prenotazioniToInsert.length} record in 'prenotazione'`,
    );
  }
  console.log(`Inseriti ${totalPrenotazioniInserted} record in 'prenotazione'`);

  // --- G. POSTI ---
  const postoFilePath = path.join(initDataDir, 'posto.csv');
  if (fs.existsSync(postoFilePath)) {
    const postoData = await readCsv(postoFilePath);
    const postiToInsert = postoData
      .map((row) => ({
        prenotazione_id: prenotazioneMap.get(String(row.prenotazione_id ?? row.prenotazioneId))!,
        riga: Number(row.riga),
        colonna: Number(row.colonna),
      }))
      .filter((p) => p.prenotazione_id);

    const postoChunks = chunkArray(postiToInsert, 2000);
    for (const chunk of postoChunks) {
      await db.insert(posto).values(chunk);
    }
    console.log(`Inseriti ${postiToInsert.length} record in 'posto'`);
  }

  console.log('\nSeeding completato con successo!');
}
