import { ConflictError, ForbiddenError, NotFoundError } from '../config/app-error.js';
import type { prenotazione } from '../db/schema.js';
import type { PrenotazioneRepository } from '../repositories/prenotazione.repository.js';
import type { ProiezioneRepository } from '../repositories/proiezione.repository.js';
import type { SaleRepository } from '../repositories/sale.repository.js';
import type { CreatePrenotazioneInput } from '../schemas/prenotazione.schema.js';

type Prenotazione = typeof prenotazione.$inferSelect;

export interface PaginatedPrenotazioniResponse {
  data: Awaited<ReturnType<PrenotazioneRepository['findByUtenteId']>>['data'];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export class PrenotazioneService {
  constructor(
    private readonly prenotazioneRepository: PrenotazioneRepository,
    private readonly proiezioneRepository: ProiezioneRepository,
    private readonly salaRepository: SaleRepository,
  ) {}

  async create(utenteId: string, input: CreatePrenotazioneInput): Promise<Prenotazione> {
    const proiezione = await this.proiezioneRepository.findById(input.proiezioneId);
    if (!proiezione) {
      throw new NotFoundError('Proiezione non trovata');
    }
    const prenotazioniAttuali = await this.prenotazioneRepository.countByProiezioneId(
      input.proiezioneId,
    );
    const sala = (await this.salaRepository.findById(proiezione.sala_id))!;
    const righe = sala.righe;
    const colonne = sala.colonne;
    if (prenotazioniAttuali >= sala.capienza!) {
      throw new ForbiddenError('La proiezione selezionata è sold out');
    }
    if (input.colonna > colonne || input.riga > righe) {
      throw new ForbiddenError('Il posto selezionato è inesistente');
    }

    const result = await this.prenotazioneRepository.createConConcorrenza({
      utente_id: utenteId,
      proiezione_id: input.proiezioneId,
      riga: input.riga,
      colonna: input.colonna,
      stato: input.stato,
    });

    // Controllo della proprietà "success" e dell'effettiva presenza dei dati
    if (
      !result ||
      !('success' in result) ||
      !result.success ||
      !('data' in result) ||
      !result.data
    ) {
      throw new ConflictError(
        'Il posto selezionato è già stato prenotato o è in corso di prenotazione da un altro utente.',
      );
    }

    return result.data as Prenotazione;
  }

  async getPrenotazioniByUser(
    utenteId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedPrenotazioniResponse> {
    const { data, totalRecords } = await this.prenotazioneRepository.findByUtenteId(
      utenteId,
      page,
      limit,
    );

    return {
      data,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  async getById(
    id: string,
    utenteId: string,
  ): Promise<NonNullable<Awaited<ReturnType<PrenotazioneRepository['findByIdAndUtenteId']>>>> {
    const prenotazione = await this.prenotazioneRepository.findByIdAndUtenteId(id, utenteId);
    if (!prenotazione) {
      throw new NotFoundError('Prenotazione non trovata.');
    }
    return prenotazione;
  }

  async delete(id: string, utenteId: string): Promise<boolean> {
    const prenotazione = await this.prenotazioneRepository.findByIdAndUtenteId(id, utenteId);
    if (!prenotazione) {
      throw new NotFoundError('Prenotazione non trovata o già annullata.');
    }
    const proiezione = await this.proiezioneRepository.findById(prenotazione.proiezione_id);
    if (!proiezione) {
      throw new NotFoundError('Proiezione associata non trovata.');
    }
    const orarioAttuale = new Date();
    const orarioLimite = new Date(orarioAttuale.getTime() + 2 * 60 * 60 * 1000);
    const inizioEvento = new Date(proiezione.data_ora_inizio);
    if (inizioEvento < orarioLimite) {
      throw new ForbiddenError(
        "La cancellazione può essere effettuata fino a 2 ore prima dell'evento.",
      );
    }
    const deleted = await this.prenotazioneRepository.softDelete(id, utenteId);
    if (!deleted) {
      throw new NotFoundError('Impossibile annullare la prenotazione.');
    }
    return true;
  }

  async getPrenotazioniByProiezioneId(
    utenteId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedPrenotazioniResponse> {
    const { data, totalRecords } = await this.prenotazioneRepository.findByProiezioneId(
      utenteId,
      page,
      limit,
    );

    return {
      data,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }
}
