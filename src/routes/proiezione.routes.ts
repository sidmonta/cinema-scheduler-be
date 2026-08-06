import { Router } from "express";
import { ProiezioneController } from "../controllers/proiezione.controller.js";
import { ProiezioneRepository } from "../repositories/proiezione.repository.js";
import { ProiezioneService } from "../services/proiezione.service.js";
import { FilmRepository } from "../repositories/film.repository.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createProiezioneSchema, proiezioneIdParamSchema, proiezionePaginationQuerySchema, updateProiezioneSchema } from "../schemas/proiezione.schema.js";

const proiezioneRepository = new ProiezioneRepository();
const filmRepository = new FilmRepository();
const proiezioneService = new ProiezioneService(proiezioneRepository, filmRepository); // Passa anche il FilmRepository al ProiezioneService
const proiezioneController = new ProiezioneController(proiezioneService);

const router = Router();

router.post("/", validate(createProiezioneSchema), proiezioneController.create);
router.get("/", validate(proiezionePaginationQuerySchema), proiezioneController.getAll);
router.get("/:id", validate(proiezioneIdParamSchema), proiezioneController.getById);
router.patch("/:id", validate(updateProiezioneSchema), proiezioneController.update);
router.delete("/:id", validate(proiezioneIdParamSchema), proiezioneController.delete);

export default router;