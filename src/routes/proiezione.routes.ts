import { Router } from 'express';
import { ProiezioneController } from '../controllers/proiezione.controller.js';
import { ProiezioneRepository } from '../repositories/proiezione.repository.js';
import { ProiezioneService } from '../services/proiezione.service.js';
import { FilmRepository } from '../repositories/film.repository.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createProiezioneSchema,
  deletProiezioneSchema,
  getPalinsestoSchema,
  proiezioneIdParamSchema,
  proiezionePaginationQuerySchema,
  updateProiezioneSchema,
} from '../schemas/proiezione.schema.js';
import { SaleRepository } from '../repositories/sale.repository.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Email } from '../utils/email.utils.js';
import { UtenteRepository } from '../repositories/utente.repository.js';

const proiezioneRepository = new ProiezioneRepository();
const filmRepository = new FilmRepository();
const salaRepository = new SaleRepository();
const utenteRepository = new UtenteRepository();
const email = new Email();
const proiezioneService = new ProiezioneService(
  proiezioneRepository,
  filmRepository,
  salaRepository,
  utenteRepository,
  email,
); // Passa anche il FilmRepository al ProiezioneService
const proiezioneController = new ProiezioneController(proiezioneService);

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createProiezioneSchema),
  proiezioneController.create,
);
router.get('/', validate(proiezionePaginationQuerySchema), proiezioneController.getAll);
router.get('/:id', validate(proiezioneIdParamSchema), proiezioneController.getById);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateProiezioneSchema),
  proiezioneController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(deletProiezioneSchema),
  proiezioneController.delete,
);
router.get(
  '/palinsesto/:data',
  validate(getPalinsestoSchema), // Valida req.query.data
  proiezioneController.getPalinsesto,
);

export default router;
