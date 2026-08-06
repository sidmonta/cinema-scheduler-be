import type { ProiezioneService } from "../services/proiezione.service.js";
import type { Request, Response } from "express";

export class ProiezioneController {
  constructor(private readonly proiezioneService: ProiezioneService) {}

  create = async (req: Request, res: Response) => {
    const proiezione = await this.proiezioneService.createProiezione(
      res.locals.body,
    );
    res.status(201).json({ data: proiezione });
  };

  getById = async (req: Request, res: Response) => {
    const proiezione = await this.proiezioneService.findProiezioneById(
      res.locals.params.id,
    );
    res.status(200).json({ data: proiezione });
  };

  update = async (req: Request, res: Response) => {
    const updatedProiezione = await this.proiezioneService.updateProiezione(
      res.locals.params.id,
      res.locals.body,
    );
    res.status(200).json({ data: updatedProiezione });
  };

  delete = async (req: Request, res: Response) => {
    await this.proiezioneService.updateProiezioneExistence(
      res.locals.params.id,
      { eliminata: false },
    );
    res.status(204).send();
  };

  getAll = async (req: Request, res: Response) => {
    const { page, limit } = res.locals.query;
    const proiezioni = await this.proiezioneService.findAll(page, limit);
    res.status(200).json({ data: proiezioni });
  };
}
