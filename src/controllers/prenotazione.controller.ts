import type { Request, Response } from 'express';
import type { PrenotazioneService } from '../services/prenotazione.service.js';
import type {
  CreatePrenotazioneInput,
  PrenotazionePaginationQueryInput,
} from '../schemas/prenotazione.schema.js';
import { UnauthorizedError } from '../config/app-error.js';

export class PrenotazioneController {
  constructor(private readonly prenotazioneService: PrenotazioneService) {}

  // POST /
  create = async (req: Request, res: Response): Promise<Response> => {
    // Recupero automatico ID utente dal Token JWT
    const utenteId = req.user?.sub;

    if (!utenteId) {
      throw new UnauthorizedError('Utente non autenticato o token non valido.');
    }

    const body = req.body as CreatePrenotazioneInput;
    const prenotazione = await this.prenotazioneService.create(utenteId, body);

    return res.status(201).json({
      success: true,
      data: prenotazione,
    });
  };

  // GET /mie (o /utente)
  getPrenotazioniByUser = async (req: Request, res: Response): Promise<Response> => {
    const utenteId = req.user?.sub;

    if (!utenteId) {
      throw new UnauthorizedError('Utente non autenticato o token non valido.');
    }

    // Cast pulito dai parametri di query validati dallo schema Zod
    const { page, limit } = req.query as unknown as PrenotazionePaginationQueryInput;

    const result = await this.prenotazioneService.getPrenotazioniByUser(utenteId, page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  };

  // GET /:id
  getById = async (req: Request, res: Response): Promise<Response> => {
    const utenteId = req.user?.sub;

    if (!utenteId) {
      throw new UnauthorizedError('Utente non autenticato o token non valido.');
    }

    const id = req.params.id as string;
    const result = await this.prenotazioneService.getById(id, utenteId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  // DELETE /:id
  delete = async (req: Request, res: Response): Promise<Response> => {
    const utenteId = req.user?.sub;
    if (!utenteId) {
      throw new UnauthorizedError('Utente non autenticato o token non valido.');
    }
    const id = req.params.id as string;
    await this.prenotazioneService.delete(id, utenteId);
    return res.status(204).send();
  };
}
