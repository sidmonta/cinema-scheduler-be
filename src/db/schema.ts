import { pgTable, uuid, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const sala = pgTable('sala', {
    id: uuid('id').defaultRandom().primaryKey(),
    nome: varchar('nome', { length: 255 }).notNull(),
    capienza: integer('capienza').notNull(),
    file: integer('file').notNull(),
    colonne: integer('colonne').notNull(),
    creata_il: timestamp('creata_il').notNull().defaultNow(),
    aggiornata_il: timestamp('aggiornata_il').notNull().defaultNow(),
    eliminata: boolean('eliminata').notNull().default(false),
});

export const classificazione = pgEnum('classificazione', {
    'T': 'T',
    '14+': '14+',
    '18+': '18+',
});

export const film = pgTable('film', {
    id: uuid('id').defaultRandom().primaryKey(),
    titolo: varchar('titolo', { length: 255 }).notNull(),
    durata: integer('durata').notNull(),
    genere: varchar('genere', { length: 255 }).notNull(),
    classificazione: classificazione('classificazione').notNull(),
    creata_il: timestamp('creata_il').notNull().defaultNow(),
    aggiornata_il: timestamp('aggiornata_il').notNull().defaultNow(),
    eliminata: boolean('eliminata').notNull().default(false),
});
