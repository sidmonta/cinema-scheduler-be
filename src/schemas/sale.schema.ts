import z from "zod";
import { registry } from "../docs/openapi.registry.js";

export const SaleSchema = registry.register(
  'Sale',
  z.object({
    id: z.string().uuid().openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
    cinemaId: z.string().uuid().openapi({ example: '888e4567-e89b-12d3-a456-426614174111' }),
    nome: z.string().openapi({ example: 'Sala IMAX' }),
    righe: z.number().int().positive().openapi({ example: 10 }),
    colonne: z.number().int().positive().openapi({ example: 15 }),
    capienza: z.number().int().positive().openapi({ example: 150 }),
  })
);

export const saleIdParamSchema = z.object({
  id: z.string().uuid("ID non valido").openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
});

const baseCreateSaleSchema = z.object({
  cinema_id: z.string().uuid("ID del cinema non valido" ).openapi({ example: '888e4567-e89b-12d3-a456-426614174111' }),
  nome: z.string().min(1, "Il nome è obbligatorio").openapi({ example: 'Sala IMAX' }),
  righe: z
    .number()
    .int()
    .positive("Il numero di righe deve essere un numero positivo").openapi({ example: 10 }),
  colonne: z
    .number()
    .int()
    .positive("Il numero di colonne deve essere un numero positivo").openapi({ example: 15 }),
});

export const createSaleBodySchema = baseCreateSaleSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: "Il corpo della richiesta non può essere vuoto" },
);

export const updateSaleBodySchema = baseCreateSaleSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Fornire almeno un campo da aggiornare",
  });

export const updateSaleExistenceBodySchema = z.object({
  eliminata: z.boolean(),
});

export const salePaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const getSalesSchema = z.object({
  query: salePaginationQuerySchema,
});

export const createSaleSchema = z.object({
  body: createSaleBodySchema,
});

export const getSaleByIdSchema = z.object({
  params: saleIdParamSchema,
});

export const updateSaleSchema = z.object({
  params: saleIdParamSchema,
  body: updateSaleBodySchema,
});

export const updateSaleExistenceSchema = z.object({
  params: saleIdParamSchema,
  body: updateSaleExistenceBodySchema,
});

export type CreateSaleInput = z.infer<typeof createSaleBodySchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleBodySchema>;
export type UpdateSaleExistenceInput = z.infer<
  typeof updateSaleExistenceBodySchema
>;
export type SalePaginationQuery = z.infer<typeof salePaginationQuerySchema>;
export type SaleIdParam = z.infer<typeof saleIdParamSchema>;
