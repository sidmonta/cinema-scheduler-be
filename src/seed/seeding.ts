import fs from "node:fs";
import path from "node:path";
import csv from "csv-parser";
import { sql } from "drizzle-orm";
import {
  cinema,
  sala,
  film,
  proiezione,
  utente,
  prenotazione,
  posto,
} from "../db/schema.js";
import { db } from "../config/drizzle.config.connection.js";

function readCsv<T = any>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File non trovato: ${filePath}`));
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

export async function runCsvSeed() {
  console.log(" 1. Pulizia tabelle...");
  await db.execute(
    sql`TRUNCATE TABLE posto, prenotazione, proiezione, utente, film, sala, cinema RESTART IDENTITY CASCADE;`
  );

  const initDataDir = path.join(process.cwd(), "init-data");
  console.log(` 2. Caricamento CSV e generazione automatica UUID...\n`);

  const cinemaMap = new Map<string, string>();
  const salaMap = new Map<string, string>();
  const filmMap = new Map<string, string>();
  const utenteMap = new Map<string, string>();
  const proiezioneMap = new Map<string, string>();
  const prenotazioneMap = new Map<string, string>();

  // --- A. CINEMA ---
  const cinemaData = await readCsv(path.join(initDataDir, "cinema.csv"));
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
  console.log(`✅ Inseriti ${cinemaData.length} record in 'cinema'`);

  // --- B. SALE ---
  const saleData = await readCsv(path.join(initDataDir, "sale.csv"));
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
  console.log(` Inseriti ${saleData.length} record in 'sala'`);

  // --- C. FILM ---
  const filmData = await readCsv(path.join(initDataDir, "film.csv"));
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
  console.log(` Inseriti ${filmData.length} record in 'film'`);

  // --- D. UTENTI ---
  const utenteData = await readCsv(path.join(initDataDir, "utenti.csv"));
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
  console.log(` Inseriti ${utenteData.length} record in 'utente'`);

  // --- E. PROIEZIONI ---
  const proiezioneData = await readCsv(path.join(initDataDir, "proiezioni.csv"));
  for (const row of proiezioneData) {
    const [inserted] = await db
      .insert(proiezione)
      .values({
        sala_id: salaMap.get(String(row.sala_id ?? row.salaId))!, 
        film_id: filmMap.get(String(row.film_id ?? row.filmId))!, 
        data_ora_inizio: new Date(row.data_ora_inizio ?? row.dataOraInizio),
        data_ora_fine: new Date(row.data_ora_fine ?? row.dataOraFine),
      })
      .returning();

    if (row.id) proiezioneMap.set(String(row.id), inserted.id);
  }
  console.log(` Inseriti ${proiezioneData.length} record in 'proiezione'`);

  // --- F. PRENOTAZIONI ---
  const prenotazioneData = await readCsv(path.join(initDataDir, "prenotazioni.csv"));
  for (const row of prenotazioneData) {
    const utenteId = utenteMap.get(String(row.utente_id ?? row.utenteId));
    const proiezioneId = proiezioneMap.get(String(row.proiezione_id ?? row.proiezioneId));

    // Controllo di sicurezza se un ID non viene trovato nella Map
    if (!utenteId || !proiezioneId) {
      console.error(` Errore mappa: utente_id (${row.utente_id}) o proiezione_id (${row.proiezione_id}) non trovati.`);
      continue;
    }

    const [inserted] = await db
      .insert(prenotazione)
      .values({
        // Nota: se il tuo schema Drizzle usa la nomenclatura camelCase (es. utenteId / proiezioneId)
        // assegna le chiavi corrette. Se usa snake_case lascia utente_id / proiezione_id.
        utente_id: utenteId,
        proiezione_id: proiezioneId, 
        riga: Number(row.riga),
        colonna: Number(row.colonna),
        stato: row.stato ?? "CONFIRMED", // Prende 'CONFIRMED' dal CSV
      })
      .returning();

    if (row.id) prenotazioneMap.set(String(row.id), inserted.id);
  }
  console.log(` Inseriti ${prenotazioneData.length} record in 'prenotazione'`);

  // --- G. POSTI ---
  const postoFilePath = path.join(initDataDir, "posto.csv");
  if (fs.existsSync(postoFilePath)) {
    const postoData = await readCsv(postoFilePath);
    for (const row of postoData) {
      await db.insert(posto).values({
        prenotazione_id: prenotazioneMap.get(String(row.prenotazione_id ?? row.prenotazioneId))!, 
        riga: Number(row.riga),
        colonna: Number(row.colonna),
      });
    }
    console.log(` Inseriti ${postoData.length} record in 'posto'`);
  }

  console.log("\n Seeding completato con successo!");
}