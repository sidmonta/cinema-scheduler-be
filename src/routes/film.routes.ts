import { Router } from "express";
import { FilmController } from "../controllers/film.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { FilmRepository } from "../repositories/film.repository.js";
import { createFilmSchema, filmIdParamSchema, updateFilmSchema, filmPaginationQuerySchema } from "../schemas/film.schema.js";
import { FilmService } from "../services/film.service.js";

const filmRepository = new FilmRepository();
const filmService = new FilmService(filmRepository);
const filmController = new FilmController(filmService);

const router = Router();

router.post('/', validate(createFilmSchema), filmController.create);
router.get('/', validate(filmPaginationQuerySchema), filmController.getAll);
router.get('/:id', validate(filmIdParamSchema), filmController.getById);
router.patch('/:id', validate(updateFilmSchema), filmController.update);
router.delete('/:id', validate(filmIdParamSchema), filmController.delete);

export default router;