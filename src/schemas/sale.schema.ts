import z from "zod";

export const saleIdParamSchema = z.object({
  id: z.string().uuid("ID non valido"),
});

const baseCreateSaleSchema = z.object({
  cinema_id: z.string().uuid("ID del cinema non valido"),
  nome: z.string().min(1, "Il nome è obbligatorio"),
  righe: z
    .number()
    .int()
    .positive("Il numero di righe deve essere un numero positivo"),
  colonne: z
    .number()
    .int()
    .positive("Il numero di colonne deve essere un numero positivo"),
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
