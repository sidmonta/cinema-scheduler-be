import z from 'zod';
import { registry } from '../docs/openapi.registry.js';

// ==========================================
// 1. QUERY PARAMS SCHEMA
// ==========================================

export const statisticsQuerySchema = registry.register(
  'Statistiche',
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

// ==========================================
// 2. UNIFIED RESPONSE SCHEMA (OPENAPI REGISTERED)
// ==========================================

export const StatisticsReportResponseSchema = registry.register(
  'StatisticsReportResponse',
  z.array(
    z.object({
      salaId: z.string().uuid().openapi({ example: 'abc34567-e89b-12d3-a456-426614174999' }),
      nomeSala: z.string().openapi({ example: 'Sala IMAX' }),
      totaleProiezioni: z.number().int().nonnegative().openapi({ example: 45 }),
      percentualeOccupazioneTotale: z.number().min(0).max(100).openapi({ example: 68.5 }),
      proiezioni: z.array(
        z.object({
          proiezioneId: z
            .string()
            .uuid()
            .openapi({ example: 'a1114567-e89b-12d3-a456-426614174000' }),
          dataInizio: z
            .date()
            .or(z.string().datetime())
            .openapi({ example: '2026-08-15T20:30:00.000Z' }),
          matriceOccupazione: z.array(z.array(z.number().int().min(0).max(1))).openapi({
            example: [
              [1, 1, 0, 0],
              [0, 1, 1, 0],
              [0, 0, 0, 0],
            ],
            description: 'Matrice della sala con 1 per posto prenotato e 0 per posto libero',
          }),
          postiOccupati: z.number().int().nonnegative().openapi({ example: 4 }),
          capienzaTotale: z.number().int().positive().openapi({ example: 12 }),
          percentualeOccupazione: z.number().min(0).max(100).openapi({ example: 33.33 }),
        }),
      ),
    }),
  ),
);

// ==========================================
// 3. MAIN ROUTE VALIDATION SCHEMA
// ==========================================

export const getStatisticsSchema = z.object({
  query: statisticsQuerySchema,
});

// ==========================================
// 4. TYPE INFERENCES
// ==========================================

export type StatisticsQueryInput = z.infer<typeof statisticsQuerySchema>;
export type StatisticsReportResponse = z.infer<typeof StatisticsReportResponseSchema>;
export type SalaOccupancyReport = StatisticsReportResponse[number];
export type ProiezioneOccupancyReport = SalaOccupancyReport['proiezioni'][number];
export type GetStatisticsInput = z.infer<typeof getStatisticsSchema>;
