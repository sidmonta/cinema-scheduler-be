import z from 'zod';
import { registry } from '../docs/openapi.registry.js';

// ==========================================
// 1. QUERY PARAMS & PARAMS SCHEMAS
// ==========================================

export const statisticsQuerySchema = registry.register(
  'StatisticsQuery',
  z.object({
    anno: z.coerce
      .number()
      .int("L'anno deve essere un numero intero")
      .min(2000, "L'anno deve essere superiore o uguale al 2000")
      .max(2100, "L'anno fornito non è valido")
      .openapi({ example: 2026, description: 'Anno di riferimento per le statistiche' }),
    mese: z.coerce
      .number()
      .int('Il mese deve essere un numero intero')
      .min(1, 'Il mese deve essere compreso tra 1 e 12')
      .max(12, 'Il mese deve essere compreso tra 1 e 12')
      .openapi({ example: 8, description: 'Mese di riferimento (1-12)' }),
  }),
);

export const proiezioneIdParamSchema = z.object({
  id: z.string().uuid("L'ID della proiezione deve essere un UUID valido").openapi({
    example: 'a1114567-e89b-12d3-a456-426614174000',
    description: 'ID identificativo della proiezione',
  }),
});

// ==========================================
// 2. RESPONSE SCHEMAS
// ==========================================

// A. Report Generale Mensile (SENZA Matrice per prevenire crash di Swagger UI)
export const StatisticsReportResponseSchema = registry.register(
  'StatisticsReportResponse',
  z.array(
    z.object({
      proiezioneId: z.string().uuid().openapi({ example: 'a1114567-e89b-12d3-a456-426614174000' }),
      salaId: z.string().uuid().openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
      nomeSala: z.string().openapi({ example: 'Sala IMAX' }),
      dataOra: z.date().or(z.string().datetime()).openapi({ example: '2026-08-15T20:30:00.000Z' }),
      postiOccupati: z.number().int().nonnegative().openapi({ example: 42 }),
      capienzaTotale: z.number().int().positive().openapi({ example: 120 }),
      percentualeOccupazione: z.number().min(0).max(100).openapi({ example: 35.0 }),
    }),
  ),
);

// B. Dettaglio Singola Proiezione (CON Matrice Posti)
export const ProiezioneMatriceResponseSchema = registry.register(
  'ProiezioneMatriceResponse',
  z.object({
    proiezioneId: z.string().uuid().openapi({ example: 'a1114567-e89b-12d3-a456-426614174000' }),
    salaId: z.string().uuid().openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
    nomeSala: z.string().openapi({ example: 'Sala IMAX' }),
    dataOraInizio: z
      .date()
      .or(z.string().datetime())
      .openapi({ example: '2026-08-15T20:30:00.000Z' }),
    postiOccupati: z.number().int().nonnegative().openapi({ example: 4 }),
    capienzaTotale: z.number().int().positive().openapi({ example: 12 }),
    percentualeOccupazione: z.number().min(0).max(100).openapi({ example: 33.33 }),
    matriceOccupazione: z.array(z.array(z.number().int().min(0).max(1))).openapi({
      example: [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      description: 'Matrice 2D della sala (1 = occupato, 0 = libero)',
    }),
  }),
);

// ==========================================
// 3. ROUTE VALIDATION SCHEMAS
// ==========================================

export const getStatisticsSchema = z.object({
  query: statisticsQuerySchema,
});

export const getProiezioneMatriceSchema = z.object({
  params: proiezioneIdParamSchema,
});

// ==========================================
// 4. TYPE INFERENCES
// ==========================================

export type StatisticsQueryInput = z.infer<typeof statisticsQuerySchema>;
export type StatisticsReportResponse = z.infer<typeof StatisticsReportResponseSchema>;
export type ProiezioneMatriceResponse = z.infer<typeof ProiezioneMatriceResponseSchema>;
