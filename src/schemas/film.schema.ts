import { z } from 'zod';

// Enum per la classificazione/rating
export const ClassificazioneEnum = z.enum(['T', '14+', '18+']);
export type Classificazione = z.infer<typeof ClassificazioneEnum>;

// Schema per la Creazione del Film
export const createFilmSchema = z.object({
  body: z.object({
    titolo: z.string().nonempty({ message: 'Il titolo è obbligatorio' }).min(1, 'Il titolo non può essere vuoto'),
    durataMinuti: z.number().positive('La durata deve essere un numero positivo'),
    genere: z.string().nonempty({ message: 'Il genere è obbligatorio' }).min(1, 'Il genere non può essere vuoto'),
    classificazione: ClassificazioneEnum,
  }),
});

// Schema per l'Update del Film (Tutti i campi opzionali)
export const updateFilmSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID non valido'),
  }),
  body: createFilmSchema.shape.body.partial(),
});

// Schema per l'Update dell'esistenza del Film 
export const updateFilmExistenceSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID non valido'),
  }),
  body: z.object({
    eliminata: z.boolean(),
  }),
});

// Schema per i parametri ID nei percorsi (/films/:id)
export const filmIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID non valido'),
  }),
});

// Schema per la Paginazione nella GET /films
export const filmPaginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

// Tipi derivati da Zod (z.infer)
export type CreateFilmInput = z.infer<typeof createFilmSchema>['body'];
export type UpdateFilmInput = z.infer<typeof updateFilmSchema>['body'];
export type UpdateFilmExistenceInput = z.infer<typeof updateFilmExistenceSchema>['body'];
export type FilmPaginationQuery = z.infer<typeof filmPaginationSchema>['query'];