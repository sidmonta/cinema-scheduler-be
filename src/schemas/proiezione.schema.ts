import { z } from 'zod';
import { registry } from '../docs/openapi.registry.js';

// -----------------------------------------------------------------------------
// 1. SCHEMI ATOMICI PER PARAMS / QUERY / BODY
// -----------------------------------------------------------------------------

// Resource Schema (OpenAPI)
export const ProiezioneSchema = registry.register(
  'Proiezione',
  z.object({
    id: z.string().uuid().openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
    sala_id: z.string().uuid().openapi({ example: '888e4567-e89b-12d3-a456-426614174111' }),
    film_id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    data_ora_inizio: z.string().datetime().openapi({ example: '2026-03-30T10:00:00Z' }),
    data_ora_fine: z.string().datetime().openapi({ example: '2026-03-30T12:00:00Z' }),
  }),
);

// Params: ID nell'URL (/proiezioni/:id)
export const proiezioneIdParamSchema = z.object({
  id: z.string().uuid('ID non valido').openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
});

// Query: Palinsesto per Data (?data=YYYY-MM-DD)
export const palinsestoParamSchema = z.object({
  data: z
    .string({ message: "Il parametro 'data' è obbligatorio" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Il formato della data deve essere YYYY-MM-DD (es. 2026-08-07)')
    .openapi({ example: '2026-08-07' }),
});

// Query: Paginazione
export const proiezionePaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Body: Creazione
export const baseCreateProiezioneSchema = z.object({
  sala_id: z
    .string()
    .uuid('ID della sala non valido')
    .openapi({ example: '888e4567-e89b-12d3-a456-426614174111' }),
  film_id: z
    .string()
    .uuid('ID del film non valido')
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  data_ora_inizio: z
    .string()
    .datetime('Data e ora di inizio non valida')
    .openapi({ example: '2026-03-30T10:00:00Z' }),
});

export const createProiezioneBodySchema = baseCreateProiezioneSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Il corpo della richiesta non può essere vuoto' },
);

// Body: Update
export const updateProiezioneBodySchema = baseCreateProiezioneSchema
  .extend({
    data_ora_fine: z.string().datetime('Data e ora di fine non valida').optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Fornire almeno un campo da aggiornare',
  });

// Body: Soft Delete / Existence
export const updateProiezioneExistenceBodySchema = z.object({
  eliminata: z.boolean(),
});

// -----------------------------------------------------------------------------
// 2. WRAPPER SCHEMAS PER IL MIDDLEWARE DI VALIDAZIONE EXPRESS
// -----------------------------------------------------------------------------

export const getPalinsestoSchema = z.object({
  params: palinsestoParamSchema,
});

export const getProiezioniSchema = z.object({
  query: proiezionePaginationQuerySchema,
});

export const getProiezioneByIdSchema = z.object({
  params: proiezioneIdParamSchema,
});

export const createProiezioneSchema = z.object({
  body: createProiezioneBodySchema,
});

export const updateProiezioneSchema = z.object({
  params: proiezioneIdParamSchema,
  body: updateProiezioneBodySchema,
});

export const updateProiezioneExistenceSchema = z.object({
  params: proiezioneIdParamSchema,
  body: updateProiezioneExistenceBodySchema,
});

// -----------------------------------------------------------------------------
// 3. TIPI TYPESCRIPT INFERITI
// -----------------------------------------------------------------------------

export type CreateProiezioneInput = z.infer<typeof baseCreateProiezioneSchema>;
export type UpdateProiezioneInput = z.infer<typeof updateProiezioneBodySchema>;
export type UpdateProiezioneExistenceInput = z.infer<typeof updateProiezioneExistenceBodySchema>;
export type ProiezionePaginationQueryInput = z.infer<typeof proiezionePaginationQuerySchema>;
export type ProiezioneIdParamInput = z.infer<typeof proiezioneIdParamSchema>;
export type PalinsestoQueryInput = z.infer<typeof palinsestoParamSchema>;
