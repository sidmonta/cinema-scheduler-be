console.log("Server is running, all works has done");
import express from 'express';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ValidationError } from './config/app-error.js';

const PORT = process.env.PORT || 3000;

const app = express();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(express.json());

app.get('/api/v1/test-async', async (_req, _res) => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  throw new ValidationError('Parametri del film non validi', [
    { field: 'durataMinuti', message: 'La durata deve essere maggiore di 0' },
  ]);
});

// 1. Handler per le rotte non trovate (404)
app.use(notFoundHandler);

// 2. Middleware centrale di error handling (DEVE essere l'ultimo app.use)
app.use(errorHandler);

export default app;