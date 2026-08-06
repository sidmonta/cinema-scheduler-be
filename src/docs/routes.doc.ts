import z from "zod";
import { FilmSchema, createFilmSchema, filmIdParamSchema, updateFilmSchema } from "../schemas/film.schema.js";
import { createSaleSchema, saleIdParamSchema, SaleSchema } from "../schemas/sale.schema.js";
import { registry } from "./openapi.registry.js";


// --- ROTTE FILM ---
registry.registerPath({
  method: 'get',
  path: '/films',
  tags: ['Film'],
  summary: 'Ottieni la lista dei film con paginazione',
  responses: {
    200: {
      description: 'Lista di film recuperata con successo',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(FilmSchema),
            meta: z.object({ page: z.number(), limit: z.number(), totalRecords: z.number(), totalPages: z.number() }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/films',
  tags: ['Film'],
  summary: 'Crea un nuovo film',
  request: {
    body: {
      content: { 'application/json': { schema: createFilmSchema.shape.body } },
    },
  },
  responses: {
    201: {
      description: 'Film creato con successo',
      content: { 'application/json': { schema: z.object({ data: FilmSchema }) } },
    },
    400: { description: 'Dati di input non validi' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/films/{id}',
  tags: ['Film'],
  summary: 'Ottieni un film tramite ID',
  request: { params: filmIdParamSchema },
  responses: {
    200: { description: 'Dettaglio del film', content: { 'application/json': { schema: z.object({ data: FilmSchema }) } } },
    404: { description: 'Film non trovato' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/films/{id}',
  tags: ['Film'],
  summary: 'Aggiorna parzialmente un film',
  request: {
    params: updateFilmSchema.shape.params,
    body: { content: { 'application/json': { schema: updateFilmSchema.shape.body } } },
  },
  responses: {
    200: { description: 'Film aggiornato', content: { 'application/json': { schema: z.object({ data: FilmSchema }) } } },
    404: { description: 'Film non trovato' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/films/{id}',
  tags: ['Film'],
  summary: 'Elimina un film',
  request: { params: filmIdParamSchema },
  responses: {
    204: { description: 'Film eliminato con successo' },
    404: { description: 'Film non trovato' },
  },
});

// --- ROTTE SALE ---
registry.registerPath({
  method: 'post',
  path: '/sale',
  tags: ['Sale'],
  summary: 'Crea una nuova sala',
  request: {
    body: { content: { 'application/json': { schema: createSaleSchema.shape.body } } },
  },
  responses: {
    201: { description: 'Sala creata', content: { 'application/json': { schema: z.object({ data: SaleSchema }) } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/sale/{id}',
  tags: ['Sale'],
  summary: 'Ottieni una sala tramite ID',
  request: { params: saleIdParamSchema },
  responses: {
    200: { description: 'Dettaglio sala', content: { 'application/json': { schema: z.object({ data: SaleSchema }) } } },
    404: { description: 'Sala non trovata' },
  },
});