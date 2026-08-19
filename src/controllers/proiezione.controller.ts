import type { ProiezioneService } from '../services/proiezione.service.js';
import type { Request, Response } from 'express';

export class ProiezioneController {
  constructor(private readonly proiezioneService: ProiezioneService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const proiezione = await this.proiezioneService.createProiezione(res.locals.body);
    res.status(201).json({ data: proiezione });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const proiezione = await this.proiezioneService.findProiezioneById(res.locals.params.id);
    res.status(200).json({ data: proiezione });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const updatedProiezione = await this.proiezioneService.updateProiezione(
      res.locals.params.id,
      res.locals.body,
    );
    res.status(200).json({ data: updatedProiezione });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.proiezioneService.updateProiezioneExistence(res.locals.params.id);
    res.status(204).send();
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = res.locals.query;
    const proiezioni = await this.proiezioneService.findAll(page, limit);
    res.status(200).json({ data: proiezioni });
  };

  getPalinsesto = async (req: Request, res: Response): Promise<void> => {
    // 1. Sincronizzati con come leggi gli altri campi (usa res.locals)
    // Se la rotta usa query parameter ?data=... leggi da res.locals.query.data
    // Se usa path parameter /:data leggi da res.locals.params.data
    const dataStr: string =
      res.locals.query?.data ||
      res.locals.params?.data ||
      (req.query.data as string) ||
      (req.params.data as string);

    // 2. Passa la STRINGA ("2026-08-07") al Service invece di convertirla qui a Date
    const result = await this.proiezioneService.getPalinsestoByDate(dataStr);

    if (!result.success) {
      res.status(result.error.statusCode).json({
        status: 'error',
        message: result.error.message,
      });
      return;
    }

    // Header per la cache
    res.setHeader('X-Cache-Status', result.data.source === 'cache' ? 'HIT' : 'MISS');

    res.status(200).json({
      status: 'success',
      data: result.data.proiezioni,
    });
  };
}
