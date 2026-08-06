import { z } from "zod";
import { registry } from "../docs/openapi.registry.js";

// Schema base della risorsa Proiezione (usato per i recap/OpenAPI)
export const ProiezioneSchema = registry.register(
  'Proiezione',
  z.object({
    id: z.string().uuid().openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
    sala_id: z.string().uuid().openapi({ example: '888e4567-e89b-12d3-a456-426614174111' }),
    film_id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    data_ora_inizio: z.string().datetime().openapi({ example: '2026-03-30T10:00:00Z' }),
    data_ora_fine: z.string().datetime().openapi({ example: '2026-03-30T12:00:00Z' }),
  })
);

export const proiezioneIdParamSchema = z.object({
  id: z.string().uuid("ID non valido").openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
});

// ✅ 1. Schema pulito SENZA data_ora_fine (i campi sono ORA TUTTI OBBLIGATORI)
export const baseCreateProiezioneSchema = z.object({
  sala_id: z.string().uuid("ID della sala non valido").openapi({ example: '888e4567-e89b-12d3-a456-426614174111' }),
  film_id: z.string().uuid("ID del film non valido").openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  data_ora_inizio: z.string().datetime("Data e ora di inizio non valida").openapi({ example: '2026-03-30T10:00:00Z' }),
});

export const createProiezioneBodySchema = baseCreateProiezioneSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: "Il corpo della richiesta non può essere vuoto" }
);

// ✅ 2. Schema di UPDATE: qui estendiamo con data_ora_fine opzionale e rendiamo tutto parziale
export const updateProiezioneBodySchema = baseCreateProiezioneSchema
  .extend({
    data_ora_fine: z.string().datetime("Data e ora di fine non valida").optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Fornire almeno un campo da aggiornare",
  });

export const updateProiezioneExistenceBodySchema = z.object({
  eliminata: z.boolean(),
}); 

export const proiezionePaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Wrapper Schemas per il Middleware di Validazione
export const getProiezioniSchema = z.object({
  query: proiezionePaginationQuerySchema,
});

export const createProiezioneSchema = z.object({
  body: createProiezioneBodySchema,
});

export const updateProiezioneSchema = z.object({
  body: updateProiezioneBodySchema,
  params: proiezioneIdParamSchema,
});

export const updateProiezioneExistenceSchema = z.object({
  body: updateProiezioneExistenceBodySchema,
  params: proiezioneIdParamSchema,
});

export const getProiezioneByIdSchema = z.object({
  params: proiezioneIdParamSchema,
});

// ✅ 3. TIPI TYPESCRIPT: Infeire il tipo direttamente dallo schema base (senza l'effetto collaterale del .refine)
export type CreateProiezioneInput = z.infer<typeof baseCreateProiezioneSchema>;
export type UpdateProiezioneInput = z.infer<typeof updateProiezioneBodySchema>;
export type UpdateProiezioneExistenceInput = z.infer<typeof updateProiezioneExistenceBodySchema>;
export type ProiezionePaginationQueryInput = z.infer<typeof proiezionePaginationQuerySchema>;
export type ProiezioneIdParamInput = z.infer<typeof proiezioneIdParamSchema>;