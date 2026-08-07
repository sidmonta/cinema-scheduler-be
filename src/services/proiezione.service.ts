import { ok, err } from "../config/result.type.js"; 
import { NotFoundError } from "../config/app-error.js";
import { FilmRepository } from "../repositories/film.repository.js";
import {
  ProiezioneRepository,
  type CreateProiezioneRepoInput,
} from "../repositories/proiezione.repository.js";
import type {
  CreateProiezioneInput,
  UpdateProiezioneExistenceInput,
} from "../schemas/proiezione.schema.js";
import { buildPalinsestoCacheKey, invalidatePalinsestoCache, PALINSESTO_TTL_SECONDS } from "../utils/cache.utils.js";
import { redisClient } from "../config/redis.config.js";

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
      return err(
        new NotFoundError(`Film con ID ${data.film_id} non trovato.`)
      );
    }

    const dataInizio = new Date(data.data_ora_inizio);
    const durataTotaleMinuti =
      film.durata_minuti + ProiezioneService.TEMPO_PULIZIA_MINUTI;

    const dataFine = new Date(
      dataInizio.getTime() +
        durataTotaleMinuti * ProiezioneService.MILLISECONDS_IN_A_MINUTE,
    );

    const nuovaProiezione = await this.proiezioneRepository.create({
      sala_id: data.sala_id,
      film_id: data.film_id,
      data_ora_inizio: dataInizio,
      data_ora_fine: dataFine,
    });

    // ✅ Formattazione pulita YYYY-MM-DD per invalidare la cache
    const dataFormatted = dataInizio.toISOString().split('T')[0];
    await invalidatePalinsestoCache(dataFormatted);

    return ok(nuovaProiezione);
  }

  async findProiezioneById(id: string) {
    const proiezione = await this.proiezioneRepository.findById(id);
    if (!proiezione) {
      return err(
        new NotFoundError(`Proiezione con ID '${id}' non trovata`)
      );
    }
    return ok(proiezione);
  }

  async updateProiezione(id: string, data: Partial<CreateProiezioneInput>) {
    // 1. Verifichiamo l'esistenza della proiezione
    const proiezioneResult = await this.findProiezioneById(id);
    if (!proiezioneResult.success) {
      return proiezioneResult; // ✅ FIX: Ritorna direttamente l'errore senza incapsularlo in ok()
    }
    const proiezioneEsistente = proiezioneResult.data;
    const updateData: Partial<CreateProiezioneRepoInput> = {};

    if (data.sala_id) {
      updateData.sala_id = data.sala_id;
    }

    const nuovoFilmId = data.film_id || proiezioneEsistente.film_id;
    const nuovaDataInizioStr = data.data_ora_inizio;

    if (nuovaDataInizioStr || data.film_id) {
      const film = await this.filmRepository.findById(nuovoFilmId);
      if (!film) {
        return err(
          new NotFoundError(`Film con ID ${nuovoFilmId} non trovato.`)
        );
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
      updateData.film_id = nuovoFilmId;
    }

    const proiezioneAggiornata = await this.proiezioneRepository.update(id, updateData);

    // ✅ FIX: Invalida la cache per la data della proiezione
    const dataFormatted = new Date(proiezioneEsistente.data_ora_inizio).toISOString().split('T')[0];
    await invalidatePalinsestoCache(dataFormatted);

    return ok(proiezioneAggiornata);
  }

  async updateProiezioneExistence(
    id: string,
    input: UpdateProiezioneExistenceInput,
  ) {
    const proiezioneResult = await this.findProiezioneById(id);
    if (!proiezioneResult.success) {
      return proiezioneResult;
    }

    const updated = await this.proiezioneRepository.updateExistence(id, input);

    // ✅ FIX: Invalida la cache in caso di eliminazione o ripristino
    const dataFormatted = new Date(proiezioneResult.data.data_ora_inizio).toISOString().split('T')[0];
    await invalidatePalinsestoCache(dataFormatted);

    return ok(updated);
  }

  async findAll(page: number, limit: number) {
    const result = await this.proiezioneRepository.findAll(page, limit);
    return ok(result);
  }

  // ✅ FIX COMPLETO: Accetta stringa "YYYY-MM-DD" e previene errori di data
  async getPalinsestoByDate(dataStr: string) {
    // Normalizziamo la stringa prendendo solo la parte YYYY-MM-DD
    const dateFormatted = dataStr.includes('T') ? dataStr.split('T')[0] : dataStr;
    const cacheKey = buildPalinsestoCacheKey(dateFormatted);

    // 1. Lettura da Redis Cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return ok({
        source: 'cache',
        proiezioni: JSON.parse(cachedData),
      });
    }

    // 2. Lettura da Database (passiamo la stringa formattata YYYY-MM-DD al Repository)
    const proiezioni = await this.proiezioneRepository.findByData(dateFormatted);

    // 3. Scrittura in Cache
    await redisClient.set(
      cacheKey,
      JSON.stringify(proiezioni),
      'EX',
      PALINSESTO_TTL_SECONDS
    );

    return ok({
      source: 'db',
      proiezioni,
    });
  }
}