import z from 'zod';
import {
  FilmSchema,
  createFilmSchema,
  filmIdParamSchema,
  updateFilmSchema,
} from '../schemas/film.schema.js';
import { createSaleSchema, saleIdParamSchema, SaleSchema } from '../schemas/sale.schema.js';
import { registry } from './openapi.registry.js';
import {
  createProiezioneSchema,
  ProiezioneSchema,
  proiezionePaginationQuerySchema,
  proiezioneIdParamSchema,
  updateProiezioneSchema,
  palinsestoParamSchema,
} from '../schemas/proiezione.schema.js';
import { loginBodySchema, registerBodySchema } from '../schemas/auth.schema.js';

// --- ROTTE FILM ---
// 1. GET /films
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
            meta: z.object({
              page: z.number(),
              limit: z.number(),
              totalRecords: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  },
});

// 2. POST /films
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
      content: {
        'application/json': { schema: z.object({ data: FilmSchema }) },
      },
    },
    400: { description: 'Dati di input non validi' },
  },
});

// 3. GET /films/{id}
registry.registerPath({
  method: 'get',
  path: '/films/{id}',
  tags: ['Film'],
  summary: 'Ottieni un film tramite ID',
  request: { params: filmIdParamSchema },
  responses: {
    200: {
      description: 'Dettaglio del film',
      content: {
        'application/json': { schema: z.object({ data: FilmSchema }) },
      },
    },
    404: { description: 'Film non trovato' },
  },
});

// 4. PATCH /films/{id}
registry.registerPath({
  method: 'patch',
  path: '/films/{id}',
  tags: ['Film'],
  summary: 'Aggiorna parzialmente un film',
  request: {
    params: updateFilmSchema.shape.params,
    body: {
      content: { 'application/json': { schema: updateFilmSchema.shape.body } },
    },
  },
  responses: {
    200: {
      description: 'Film aggiornato',
      content: {
        'application/json': { schema: z.object({ data: FilmSchema }) },
      },
    },
    404: { description: 'Film non trovato' },
  },
});

// 5. DELETE /films/{id}
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
// 1. POST /sale
registry.registerPath({
  method: 'post',
  path: '/sale',
  tags: ['Sale'],
  summary: 'Crea una nuova sala',
  request: {
    body: {
      content: { 'application/json': { schema: createSaleSchema.shape.body } },
    },
  },
  responses: {
    201: {
      description: 'Sala creata',
      content: {
        'application/json': { schema: z.object({ data: SaleSchema }) },
      },
    },
  },
});

// 2. GET /sale
registry.registerPath({
  method: 'get',
  path: '/sale/{id}',
  tags: ['Sale'],
  summary: 'Ottieni una sala tramite ID',
  request: { params: saleIdParamSchema },
  responses: {
    200: {
      description: 'Dettaglio sala',
      content: {
        'application/json': { schema: z.object({ data: SaleSchema }) },
      },
    },
    404: { description: 'Sala non trovata' },
  },
});

// 3. PATCH /sale/{id}
registry.registerPath({
  method: 'patch',
  path: '/sale/{id}',
  tags: ['Sale'],
  summary: 'Aggiorna parzialmente una sala',
  request: {
    params: saleIdParamSchema,
    body: {
      content: { 'application/json': { schema: createSaleSchema.shape.body } },
    },
  },
  responses: {
    200: {
      description: 'Sala aggiornata',
      content: {
        'application/json': { schema: z.object({ data: SaleSchema }) },
      },
    },
    404: { description: 'Sala non trovata' },
  },
});

// 4. DELETE /sale/{id}
registry.registerPath({
  method: 'delete',
  path: '/sale/{id}',
  tags: ['Sale'],
  summary: 'Elimina una sala (soft delete)',
  request: {
    params: saleIdParamSchema,
  },
  responses: {
    204: { description: 'Sala eliminata con successo' },
    404: { description: 'Sala non trovata' },
  },
});

// 5. GET /sale
registry.registerPath({
  method: 'get',
  path: '/sale',
  tags: ['Sale'],
  summary: 'Ottieni la lista delle sale con paginazione',
  request: {
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
    }),
  },
  responses: {
    200: {
      description: 'Lista di sale recuperata con successo',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(SaleSchema),
            meta: z.object({
              page: z.number(),
              limit: z.number(),
              totalRecords: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  },
});

// --- ROTTE PROIEZIONI ---
// 1. POST /proiezioni
registry.registerPath({
  method: 'post',
  path: '/proiezioni',
  tags: ['Proiezioni'],
  summary: 'Crea una nuova proiezione',
  request: {
    body: {
      content: {
        'application/json': { schema: createProiezioneSchema.shape.body },
      },
    },
  },
  responses: {
    201: {
      description: 'Proiezione creata con successo',
      content: {
        'application/json': { schema: z.object({ data: ProiezioneSchema }) },
      },
    },
    400: { description: 'Dati di input non validi' },
    409: {
      description: 'Conflitto: la sala è già occupata in questo intervallo orario',
    },
  },
});

// 2. GET /proiezioni
registry.registerPath({
  method: 'get',
  path: '/proiezioni',
  tags: ['Proiezioni'],
  summary: 'Ottieni la lista delle proiezioni con paginazione',
  request: {
    query: proiezionePaginationQuerySchema,
  },
  responses: {
    200: {
      description: 'Lista di proiezioni recuperata con successo',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(ProiezioneSchema),
            meta: z.object({
              page: z.number(),
              limit: z.number(),
              totalRecords: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  },
});

// 3. GET /proiezioni/{id}
registry.registerPath({
  method: 'get',
  path: '/proiezioni/{id}',
  tags: ['Proiezioni'],
  summary: 'Ottieni il dettaglio di una proiezione tramite ID',
  request: { params: proiezioneIdParamSchema },
  responses: {
    200: {
      description: 'Dettaglio della proiezione',
      content: {
        'application/json': { schema: z.object({ data: ProiezioneSchema }) },
      },
    },
    404: { description: 'Proiezione non trovata' },
  },
});

// 4. PATCH /proiezioni/{id}
registry.registerPath({
  method: 'patch',
  path: '/proiezioni/{id}',
  tags: ['Proiezioni'],
  summary: 'Aggiorna parzialmente una proiezione',
  request: {
    params: proiezioneIdParamSchema,
    body: {
      content: {
        'application/json': { schema: updateProiezioneSchema.shape.body },
      },
    },
  },
  responses: {
    200: {
      description: 'Proiezione aggiornata con successo',
      content: {
        'application/json': { schema: z.object({ data: ProiezioneSchema }) },
      },
    },
    400: { description: 'Dati di input non validi' },
    404: { description: 'Proiezione non trovata' },
    409: {
      description: 'Conflitto: orari in sovrapposizione con un altra proiezione',
    },
  },
});

// 5. DELETE /proiezioni/{id}
registry.registerPath({
  method: 'delete',
  path: '/proiezioni/{id}',
  tags: ['Proiezioni'],
  summary: 'Elimina una proiezione (soft delete)',
  request: {
    params: proiezioneIdParamSchema,
  },
  responses: {
    204: { description: 'Proiezione eliminata con successo' },
    404: { description: 'Proiezione non trovata' },
  },
});

// 6. GET /palinsesto
registry.registerPath({
  method: 'get',
  path: '/proiezioni/palinsesto/{data}',
  tags: ['Palinsesto'],
  summary: 'Recupera il palinsesto per una certa data',
  request: {
    params: palinsestoParamSchema,
  },
  responses: {
    404: { description: 'Palinsesto non trovato' },
  },
});

// -- ROTTE AUTENTICAZIONE --
// 1. POST /login
registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Autenticazione'],
  summary: 'Effettua login con credenziali',
  request: {
    body: {
      content: {
        'application/json': { schema: loginBodySchema },
      },
    },
  },
  responses: {
    401: { description: 'Credenziali non valide' },
    404: { description: 'Utente non trovato' },
  },
});

// 2. POST /register
registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Autenticazione'],
  summary: 'Registra un nuovo utente con password hashata',
  request: {
    body: {
      content: {
        'application/json': { schema: registerBodySchema },
      },
    },
  },
  responses: {
    409: { description: 'Utente già registrato' },
  },
});
