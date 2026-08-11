import type { PrenotazioneRepository } from '../repositories/prenotazione.repository.js';
import type { CreatePrenotazioneInput } from '../schemas/prenotazione.schema.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../config/app-error.js';
import type { ProiezioneRepository } from '../repositories/proiezione.repository.js';
import type { SaleRepository } from '../repositories/sale.repository.js';
import { err } from '../config/result.type.js';

export class PrenotazioneService {
  constructor(
    private readonly repository: PrenotazioneRepository,
    private readonly proiezioneRepository: ProiezioneRepository,
    private readonly salaRepository: SaleRepository,
  ) {}

  async create(utenteId: string, input: CreatePrenotazioneInput) {
    const proiezione = await this.proiezioneRepository.findById(input.proiezioneId);
    if (!proiezione) {
      return err(new NotFoundError('Proiezione non trovata'));
    }
    const prenotazioniAttuali = await this.repository.countByProiezioneId(input.proiezioneId);
    const sala = (await this.salaRepository.findById(proiezione.sala_id))!;
    const righe = sala.righe;
    const colonne = sala.colonne;
    if (prenotazioniAttuali >= sala.capienza!) {
      return err(new ForbiddenError('La proiezione selezionata è sold out'));
    }
    if (input.colonna > colonne || input.fila > righe) {
      return err(new ForbiddenError('Il posto selezionato è inesistente'));
    }
    const result = await this.repository.createConConcorrenza({
      utente_id: utenteId, // Automatico dal token
      proiezione_id: input.proiezioneId,
      riga: input.fila,
      colonna: input.colonna,
      stato: input.stato,
    });
    if (!result.success) {
      throw new ConflictError(
        'Il posto selezionato è già stato prenotato o è in corso di prenotazione da un altro utente.',
      );
    }
    return result.data;
  }

  async getPrenotazioniByUser(utenteId: string, page: number = 1, limit: number = 10) {
    const { data, totalRecords } = await this.repository.findByUtenteId(utenteId, page, limit);

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

  // 3. Recupero Singola Prenotazione tramite ID
  async getById(id: string, utenteId: string) {
    const prenotazione = await this.repository.findByIdAndUtenteId(id, utenteId);
    if (!prenotazione) {
      throw new NotFoundError('Prenotazione non trovata.');
    }
    return prenotazione;
  }

  // 4. Annullamento / Eliminazione (Soft Delete)
  async delete(id: string, utenteId: string) {
    const prenotazione = await this.repository.findByIdAndUtenteId(id, utenteId);
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
    const deleted = await this.repository.softDelete(id, utenteId);
    if (!deleted) {
      throw new NotFoundError('Impossibile annullare la prenotazione.');
    }
    return true;
  }
}
