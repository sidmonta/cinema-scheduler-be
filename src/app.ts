import express from 'express';
import cors from 'cors';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import filmRoutes from './routes/film.routes.js';
import { debug } from 'util';
import './docs/routes.doc.js';
import { generateOpenAPIDocument } from './docs/openapi.registry.js';
import swaggerUi from 'swagger-ui-express';
import saleRoutes from './routes/sale.routes.js';
import proiezioneRoutes from './routes/proiezione.routes.js';
import authRoutes from './routes/auth.routes.js';
import prenotazioneRoutes from './routes/prenotazione.routes.js';
import statisticsRoutes from './routes/statistics.routes.js';
import { log } from './middlewares/log.middleware.js';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());

const openApiDocument = generateOpenAPIDocument();

app.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiDocument);
});

app.use(express.json());

app.use(log);
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use('/api/v1/films', filmRoutes);
app.use('/api/v1/sale', saleRoutes);
app.use('/api/v1/proiezioni', proiezioneRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/prenotazioni', prenotazioneRoutes);
app.use('/api/v1/statistiche', statisticsRoutes);

// 1. Handler per le rotte non trovate (404)
app.use(notFoundHandler);

// 2. Middleware centrale di error handling (DEVE essere l'ultimo app.use)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  debug('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    debug('HTTP server closed');
  });
});

export default app;
