import z from 'zod';
import { registry } from '../docs/openapi.registry.js';

// --- 1. ENUMS ---
export const StatoPrenotazioneEnum = z.enum(['CONFIRMED', 'PENDING', 'CANCELLED']).openapi({
  description: 'Stato della prenotazione',
  examples: ['CONFIRMED', 'PENDING', 'CANCELLED'],
});
export type StatoPrenotazione = z.infer<typeof StatoPrenotazioneEnum>;

// --- 2. REGISTRAZIONE SCHEMA OPENAPI (Dettaglio Risposta) ---
export const PrenotazioneSchema = registry.register(
  'Prenotazione',
  z.object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    proiezioneId: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    stato: StatoPrenotazioneEnum.default('PENDING'),
    riga: z.number().int().positive().openapi({ example: 5 }),
    colonna: z.number().int().positive().openapi({ example: 12 }),
  }),
);

// --- 3. PARAMS & QUERY SCHEMAS ---
export const prenotazioneIdParamSchema = z.object({
  id: z.string().uuid('ID non valido').openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
});

export const prenotazionePaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// --- 4. BODY SCHEMAS ---
export const createPrenotazioneBodySchema = z
  .object({
    proiezioneId: z
      .string()
      .uuid('ID Proiezione non valido')
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    stato: StatoPrenotazioneEnum.optional().default('PENDING'),
    riga: z
      .number()
      .int()
      .positive('La fila deve essere un numero positivo')
      .openapi({ example: 5 }),
    colonna: z
      .number()
      .int()
      .positive('Il posto deve essere un numero positivo')
      .openapi({ example: 12 }),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Il corpo della richiesta non può essere vuoto',
  });

// --- 5. AGGREGATORI PER IL MIDDLEWARE VALIDATE ---
export const getPrenotazioneSchema = z.object({
  query: prenotazionePaginationQuerySchema,
});

export const getPrenotazioneByIdSchema = z.object({
  params: prenotazioneIdParamSchema,
});

export const createPrenotazioneSchema = z.object({
  body: createPrenotazioneBodySchema,
});

export const deletePrenotazioneSchema = z.object({
  params: prenotazioneIdParamSchema,
});

// --- 6. TIPI INFERITI ---
export type CreatePrenotazioneInput = z.infer<typeof createPrenotazioneBodySchema>;
export type PrenotazionePaginationQueryInput = z.infer<typeof prenotazionePaginationQuerySchema>;
export type PrenotazioneIdParamInput = z.infer<typeof prenotazioneIdParamSchema>;
