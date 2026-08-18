import type { StatisticsService } from '../services/statistics.service.js';
import type { Request, Response } from 'express';

export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  createStat = async (req: Request, res: Response): Promise<void> => {
    const anno = Number(req.query.anno);
    const mese = Number(req.query.mese);

    const report = await this.statisticsService.statisticsSql(anno, mese);

    res.status(200).json(report);
  };

  createMatrix = async (req: Request, res: Response): Promise<void> => {
    const proiezioneId = String(req.params.id);

    const report = await this.statisticsService.getMatriceProiezione(proiezioneId);

    res.status(200).json(report);
  };
}
