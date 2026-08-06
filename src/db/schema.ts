import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 1. Definizione dell'Enum per le classificazioni dei film
export const classificazioneEnum = pgEnum("classificazione", [
  "T",
  "14+",
  "18+",
]);

// 2. Cinema
export const cinema = pgTable("cinema", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  indirizzo: varchar("indirizzo", { length: 255 }).notNull(),
  citta: varchar("citta", { length: 255 }).notNull(),
  telefono: varchar("telefono", { length: 255 }).notNull(),
  creata_il: timestamp("creata_il").notNull().defaultNow(),
  aggiornata_il: timestamp("aggiornata_il").notNull().defaultNow(),
  eliminata: boolean("eliminata").notNull().default(false),
});

// 3. Sala
export const sala = pgTable("sala", {
  id: uuid("id").defaultRandom().primaryKey(),
  cinema_id: uuid("cinema_id")
    .notNull()
    .references(() => cinema.id),
  nome: varchar("nome", { length: 255 }).notNull(),
  righe: integer("righe").notNull(),
  colonne: integer("colonne").notNull(),
  capienza: integer("capienza").generatedAlwaysAs(sql`"righe" * "colonne"`),
  creata_il: timestamp("creata_il").notNull().defaultNow(),
  aggiornata_il: timestamp("aggiornata_il").notNull().defaultNow(),
  eliminata: boolean("eliminata").notNull().default(false),
});

// 4. Film
export const film = pgTable("film", {
  id: uuid("id").defaultRandom().primaryKey(),
  titolo: varchar("titolo", { length: 255 }).notNull(),
  durata_minuti: integer("durata_minuti").notNull(),
  genere: varchar("genere", { length: 255 }).notNull(),
  classificazione: classificazioneEnum("classificazione").notNull(),
  creata_il: timestamp("creata_il").notNull().defaultNow(),
  aggiornata_il: timestamp("aggiornata_il").notNull().defaultNow(),
  eliminata: boolean("eliminata").notNull().default(false),
});

// 5. Proiezione
export const proiezione = pgTable("proiezione", {
  id: uuid("id").defaultRandom().primaryKey(),
  sala_id: uuid("sala_id")
    .notNull()
    .references(() => sala.id),
  film_id: uuid("film_id")
    .notNull()
    .references(() => film.id),
  data_ora_inizio: timestamp("data_ora_inizio").notNull(),
  data_ora_fine: timestamp("data_ora_fine").notNull(),
  creata_il: timestamp("creata_il").notNull().defaultNow(),
  aggiornata_il: timestamp("aggiornata_il").notNull().defaultNow(),
  eliminata: boolean("eliminata").notNull().default(false),
});

// 6. Utente
export const utente = pgTable("utente", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cognome: varchar("cognome", { length: 255 }).notNull(),
  ruolo: varchar("ruolo", { length: 255 }).notNull(),
  creata_il: timestamp("creata_il").notNull().defaultNow(),
  aggiornata_il: timestamp("aggiornata_il").notNull().defaultNow(),
  eliminata: boolean("eliminata").notNull().default(false),
});

// 7. Prenotazione
export const prenotazione = pgTable("prenotazione", {
  id: uuid("id").defaultRandom().primaryKey(),
  utente_id: uuid("utente_id")
    .notNull()
    .references(() => utente.id),
  proiezione_id: uuid("proiezione_id")
    .notNull()
    .references(() => proiezione.id),
  stato: varchar("stato", { length: 255 }).notNull(),
  creata_il: timestamp("creata_il").notNull().defaultNow(),
  aggiornata_il: timestamp("aggiornata_il").notNull().defaultNow(),
  eliminata: boolean("eliminata").notNull().default(false),
});

// 8. Posto
export const posto = pgTable("posto", {
  id: uuid("id").defaultRandom().primaryKey(),
  prenotazione_id: uuid("prenotazione_id")
    .notNull()
    .references(() => prenotazione.id),
  riga: integer("riga").notNull(),
  colonna: integer("colonna").notNull(),
  creata_il: timestamp("creata_il").notNull().defaultNow(),
  aggiornata_il: timestamp("aggiornata_il").notNull().defaultNow(),
  eliminata: boolean("eliminata").notNull().default(false),
});
