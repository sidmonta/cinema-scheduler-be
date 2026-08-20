import type { SalePaginationQuery } from '../schemas/sale.schema.js';
import type { Request, Response } from 'express';
import type { SaleService } from '../services/sale.service.js';

export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const sale = await this.saleService.createSale(res.locals.body);
    res.status(201).json({ data: sale });
  };

  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const sale = await this.saleService.getSaleById(req.params.id);
    res.status(200).json({ data: sale });
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as SalePaginationQuery;
    const result = await this.saleService.getAllSales(query);
    res.status(200).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const updatedSale = await this.saleService.updateSale(req.params.id as string, res.locals.body);
    res.status(200).json({ data: updatedSale });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.saleService.deleteSale(res.locals.params.id);
    res.status(204).send();
  };
}
