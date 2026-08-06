import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Estende Zod aggiungendo il metodo .openapi() ai tipi Zod
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Cinema Scheduler API',
      description: 'Documentazione delle API per la gestione del Cinema generata da Zod',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Server di Sviluppo Locale',
      },
    ],
  });
}