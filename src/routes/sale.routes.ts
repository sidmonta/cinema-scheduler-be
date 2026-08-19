import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { SaleRepository } from '../repositories/sale.repository.js';
import {
  saleIdParamSchema,
  updateSaleSchema,
  salePaginationQuerySchema,
  deleteSaleSchema,
} from '../schemas/sale.schema.js';
import { createSaleSchema } from '../schemas/sale.schema.js';
import { SaleService } from '../services/sale.service.js';
import { SaleController } from '../controllers/sale.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const saleRepository = new SaleRepository();
const saleService = new SaleService(saleRepository);
const saleController = new SaleController(saleService);

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createSaleSchema),
  saleController.create,
);
router.get('/', validate(salePaginationQuerySchema), saleController.getAll);
router.get('/:id', validate(saleIdParamSchema), saleController.getById);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateSaleSchema),
  saleController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(deleteSaleSchema),
  saleController.delete,
);

export default router;
