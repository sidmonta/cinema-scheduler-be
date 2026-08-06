import { z } from "zod";
import { registry } from "../docs/openapi.registry.js";

// --- ENUM ---
export const ClassificazioneEnum = z.enum(["T", "14+", "18+"]).openapi({
  description: "Classificazione del film",
  examples: ["T", "14+", "18+"],
});
export type Classificazione = z.infer<typeof ClassificazioneEnum>;


export const FilmSchema = registry.register(
  'Film',
  z.object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    titolo: z.string().openapi({ example: 'Inception' }),
    durataMinuti: z.number().int().positive().openapi({ example: 148 }),
    genere: z.string().openapi({ example: 'Fantascienza' }),
    classificazione: ClassificazioneEnum,
    creata_il: z.date().openapi({ example: '2026-03-30T10:00:00Z' }),
    aggiornata_il: z.date().openapi({ example: '2026-03-30T10:00:00Z' }),
    eliminata: z.boolean().openapi({ example: false }),
  })
);

// --- 1. PARAMS SCHEMAS (Mattoncino per l'ID) ---
export const filmIdParamSchema = z.object({
  id: z.string().uuid("ID non valido"),
}).openapi({ description: "Parametri per l'ID del film" });

// --- 2. BODY SCHEMAS (Mattoncini per il payload) ---

// Schema base per la creazione (tutti i campi obbligatori)
const baseCreateFilmSchema = z.object({
  titolo: z.string().min(1, "Il titolo è obbligatorio").openapi({ example: 'Inception' }),
  durataMinuti: z
    .number()
    .int()
    .positive("La durata deve essere un numero positivo")
    .openapi({ example: 148 }),
  genere: z.string().min(1, "Il genere è obbligatorio").openapi({ example: 'Fantascienza' }),
  classificazione: ClassificazioneEnum,
});

// Create Body: Obbligatorio e non vuoto
export const createFilmBodySchema = baseCreateFilmSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: "Il corpo della richiesta non può essere vuoto" },
);

// Update Body: Tutti i campi opzionali, ma ALMENO UNO dev'essere presente
export const updateFilmBodySchema = baseCreateFilmSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Fornire almeno un campo da aggiornare",
  });

// Soft Delete / Ripristino Body
export const updateFilmExistenceBodySchema = z.object({
  eliminata: z.boolean(),
});

// --- 3. QUERY SCHEMAS (Mattoncino per la paginazione) ---
export const filmPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// --- 4. AGGREGATORI PER I MIDDLEWARE DI ROTTA ---

// GET /films
export const getFilmsSchema = z.object({
  query: filmPaginationQuerySchema,
});

// POST /films
export const createFilmSchema = z.object({
  body: createFilmBodySchema,
});

// GET /films/:id
export const getFilmByIdSchema = z.object({
  params: filmIdParamSchema,
});

// PATCH/PUT /films/:id
export const updateFilmSchema = z.object({
  params: filmIdParamSchema,
  body: updateFilmBodySchema,
});

// PATCH /films/:id/existence
export const updateFilmExistenceSchema = z.object({
  params: filmIdParamSchema,
  body: updateFilmExistenceBodySchema,
});

// --- 5. TIPI INFERITI ---
export type CreateFilmInput = z.infer<typeof createFilmBodySchema>;
export type UpdateFilmInput = z.infer<typeof updateFilmBodySchema>;
export type UpdateFilmExistenceInput = z.infer<
  typeof updateFilmExistenceBodySchema
>;
export type FilmPaginationQuery = z.infer<typeof filmPaginationQuerySchema>;
export type FilmIdParam = z.infer<typeof filmIdParamSchema>;
