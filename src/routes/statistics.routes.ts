import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { PrenotazioneRepository } from '../repositories/prenotazione.repository.js';
import { ProiezioneRepository } from '../repositories/proiezione.repository.js';
import { SaleRepository } from '../repositories/sale.repository.js';
import { StatisticsService } from '../services/statistics.service.js';
import { getStatisticsSchema } from '../schemas/statistics.schema.js';
import { getProiezioneByIdSchema } from '../schemas/proiezione.schema.js';

const prenotazioneRepository = new PrenotazioneRepository();
const proiezioneRepository = new ProiezioneRepository();
const salaRepository = new SaleRepository();
const statisticsService = new StatisticsService(
  prenotazioneRepository,
  proiezioneRepository,
  salaRepository,
);
const statisticsController = new StatisticsController(statisticsService);

const router = Router();

router.get('/', validate(getStatisticsSchema), statisticsController.createStat);
router.get(
  '/proiezioni/:id/matrice',
  validate(getProiezioneByIdSchema),
  statisticsController.createMatrix,
);

export default router;
