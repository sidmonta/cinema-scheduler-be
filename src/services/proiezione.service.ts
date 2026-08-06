import { FilmRepository } from "../repositories/film.repository.js";
import {
  ProiezioneRepository,
  type CreateProiezioneRepoInput,
} from "../repositories/proiezione.repository.js";
import type {
  CreateProiezioneInput,
  UpdateProiezioneExistenceInput,
} from "../schemas/proiezione.schema.js";

export class ProiezioneService {
  constructor(
    private readonly proiezioneRepository: ProiezioneRepository,
    private readonly filmRepository: FilmRepository,
  ) {}

  private static readonly MILLISECONDS_IN_A_MINUTE = 60000;
  private static readonly TEMPO_PULIZIA_MINUTI = 15;

  async createProiezione(data: CreateProiezioneInput) {
    const film = await this.filmRepository.findById(data.film_id);
    if (!film) {
      throw new Error(`Film con ID ${data.film_id} non trovato.`);
    }

    // 1. Converti la stringa in un oggetto Date
    const dataInizio = new Date(data.data_ora_inizio);

    // 2. Calcola i minuti totali (durata + pulizia)
    const durataTotaleMinuti =
      film.durata_minuti + ProiezioneService.TEMPO_PULIZIA_MINUTI;

    // 3. Calcola la data e ora di fine
    const dataFine = new Date(
      dataInizio.getTime() +
        durataTotaleMinuti * ProiezioneService.MILLISECONDS_IN_A_MINUTE,
    );

    // ✅ FIX: Passa sia dataInizio che dataFine (entrambi di tipo Date) al Repository!
    return await this.proiezioneRepository.create({
      sala_id: data.sala_id,
      film_id: data.film_id,
      data_ora_inizio: dataInizio,
      data_ora_fine: dataFine,
    });
  }

  async findProiezioneById(id: string) {
    const proiezione = await this.proiezioneRepository.findById(id);
    if (!proiezione) {
      throw new Error(`Proiezione con ID '${id}' non trovata`);
    }
    return proiezione;
  }

  async updateProiezione(id: string, data: Partial<CreateProiezioneInput>) {
    const proiezioneEsistente = await this.findProiezioneById(id); // Verifica prima l'esistenza
    const updateData: Partial<CreateProiezioneRepoInput> = {};
    if (data.sala_id) {
      updateData.sala_id = data.sala_id;
    }
    const nuovoFilmId = data.film_id || proiezioneEsistente.film_id;
    const nuovaDataInizioStr = data.data_ora_inizio;

    if (nuovaDataInizioStr || data.film_id) {
      const film = await this.filmRepository.findById(nuovoFilmId);
      if (!film) {
        throw new Error(`Film con ID ${nuovoFilmId} non trovato.`);
      }
      const dataInizio = nuovaDataInizioStr
        ? new Date(nuovaDataInizioStr)
        : new Date(proiezioneEsistente.data_ora_inizio);
      const durataTotaleMinuti =
        film.durata_minuti + ProiezioneService.TEMPO_PULIZIA_MINUTI;
      const dataFine = new Date(
        dataInizio.getTime() +
          durataTotaleMinuti * ProiezioneService.MILLISECONDS_IN_A_MINUTE,
      );
      updateData.data_ora_inizio = dataInizio;
      updateData.data_ora_fine = dataFine;
    }
    return await this.proiezioneRepository.update(id, updateData);
  }

  async updateProiezioneExistence(
    id: string,
    input: UpdateProiezioneExistenceInput,
  ) {
    await this.findProiezioneById(id); // Verifica prima l'esistenza
    return await this.proiezioneRepository.updateExistence(id, input);
  }

  async findAll(page: number, limit: number) {
    return await this.proiezioneRepository.findAll(page, limit);
  }
}
