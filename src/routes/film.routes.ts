import { Router } from "express";
import { FilmController } from "../controllers/film.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { FilmRepository } from "../repositories/film.repository.js";
import { createFilmSchema, filmPaginationSchema, filmIdParamSchema, updateFilmSchema } from "../schemas/film.schema.js";
import { FilmService } from "../services/film.service.js";

const filmRepository = new FilmRepository();
const filmService = new FilmService(filmRepository);
const filmController = new FilmController(filmService);

const router = Router();

router.post('/', validate(createFilmSchema as any), filmController.create);
router.get('/', validate(filmPaginationSchema as any), filmController.getAll);
router.get('/:id', validate(filmIdParamSchema as any), filmController.getById);
router.patch('/:id', validate(updateFilmSchema as any), filmController.update);
router.delete('/:id', validate(filmIdParamSchema as any), filmController.delete);

export default router;