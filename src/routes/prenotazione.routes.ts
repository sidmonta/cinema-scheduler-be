import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createPrenotazioneSchema,
  deletePrenotazioneSchema,
  getPrenotazioneByIdSchema,
} from '../schemas/prenotazione.schema.js';
import { PrenotazioneRepository } from '../repositories/prenotazione.repository.js';
import { PrenotazioneService } from '../services/prenotazione.service.js';
import { PrenotazioneController } from '../controllers/prenotazione.controller.js';
import { ProiezioneRepository } from '../repositories/proiezione.repository.js';
import { SaleRepository } from '../repositories/sale.repository.js';

const router = Router();

const repository = new PrenotazioneRepository();
const proiezioneRepository = new ProiezioneRepository();
const saleRepository = new SaleRepository();
const service = new PrenotazioneService(repository, proiezioneRepository, saleRepository);
const controller = new PrenotazioneController(service, proiezioneRepository);

// Il middleware 'authenticate' popola req.user con il token decodificato
router.post('/', authenticate, validate(createPrenotazioneSchema), controller.create);
router.get(
  '/mie',
  authenticate,
  validate(getPrenotazioneByIdSchema),
  controller.getPrenotazioniByUser,
);
router.get('/:id', authenticate, validate(getPrenotazioneByIdSchema), controller.getById);
router.get('/proiezioneId/:id', authenticate, controller.getPrenotazioniByProiezione);
router.delete('/:id', authenticate, validate(deletePrenotazioneSchema), controller.delete);

export default router;
