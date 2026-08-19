import { Router } from 'express';
import { FilmController } from '../controllers/film.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { FilmRepository } from '../repositories/film.repository.js';
import {
  createFilmSchema,
  getFilmsSchema,
  getFilmByIdSchema,
  updateFilmSchema,
  deleteFilmSchema,
} from '../schemas/film.schema.js';
import { FilmService } from '../services/film.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const filmRepository = new FilmRepository();
const filmService = new FilmService(filmRepository);
const filmController = new FilmController(filmService);

const router = Router();

// POST /api/v1/films - Creazione film (Solo ADMIN)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createFilmSchema),
  filmController.create,
);

// GET /api/v1/films - Lista paginata (Pubblica)
router.get('/', validate(getFilmsSchema), filmController.getAll);

// GET /api/v1/films/:id - Dettaglio singolo film (Pubblico)
router.get('/:id', validate(getFilmByIdSchema), filmController.getById);

// PATCH /api/v1/films/:id - Aggiornamento dati film (Solo ADMIN)
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateFilmSchema),
  filmController.update,
);

// DELETE /api/v1/films/:id - Soft Delete standard senza body (Solo ADMIN)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(deleteFilmSchema),
  filmController.delete,
);

export default router;
