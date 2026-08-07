import { ok, err } from '../config/result.type.js';
import { ConflictError, NotFoundError } from '../config/app-error.js';
import { FilmRepository } from '../repositories/film.repository.js';
import {
  ProiezioneRepository,
  type CreateProiezioneRepoInput,
} from '../repositories/proiezione.repository.js';
import type {
  CreateProiezioneInput,
  UpdateProiezioneExistenceInput,
} from '../schemas/proiezione.schema.js';
import {
  buildPalinsestoCacheKey,
  invalidatePalinsestoCache,
  PALINSESTO_TTL_SECONDS,
} from '../utils/cache.utils.js';
import { redisClient } from '../config/redis.config.js';
import type { SaleRepository } from '../repositories/sale.repository.js';

export class ProiezioneService {
  constructor(
    private readonly proiezioneRepository: ProiezioneRepository,
    private readonly filmRepository: FilmRepository,
    private readonly salaRepository: SaleRepository,
  ) {}

  private static readonly MILLISECONDS_IN_A_MINUTE = 60000;
  private static readonly TEMPO_PULIZIA_MINUTI = 15;

  async createProiezione(data: CreateProiezioneInput) {
    // 1. Il film deve esistere
    const film = await this.filmRepository.findById(data.film_id);
    if (!film) {
      return err(new NotFoundError(`Film con ID ${data.film_id} non trovato.`));
    }

    const sala = await this.salaRepository.findById(data.sala_id);
    if (!sala) {
      return err(new NotFoundError(`Sala con id ${data.sala_id} non trovata`));
    }

    // 2. Calcolo orario di fine (durata film + tempo pulizia)
    const dataInizio = new Date(data.data_ora_inizio);
    const durataTotaleMinuti = film.durata_minuti + ProiezioneService.TEMPO_PULIZIA_MINUTI;

    const dataFine = new Date(
      dataInizio.getTime() + durataTotaleMinuti * ProiezioneService.MILLISECONDS_IN_A_MINUTE,
    );

    // 3. LOGICA DI BUSINESS: Verifica che la sala sia libera
    const occupata = await this.proiezioneRepository.isSalaOccupata(
      data.sala_id,
      dataInizio,
      dataFine,
    );

    if (occupata) {
      return err(new ConflictError("La sala è già occupata nell'intervallo orario richiesto"));
    }

    // 4. Creazione a DB (il Repository ritorna il dato grezzo)
    const nuovaProiezione = await this.proiezioneRepository.create({
      sala_id: data.sala_id,
      film_id: data.film_id,
      data_ora_inizio: dataInizio,
      data_ora_fine: dataFine,
    });

    // 5. Invalidazione Cache
    const dataFormatted = dataInizio.toISOString().split('T')[0];
    await invalidatePalinsestoCache(dataFormatted);

    return ok(nuovaProiezione);
  }

  async findProiezioneById(id: string) {
    const proiezione = await this.proiezioneRepository.findById(id);
    if (!proiezione) {
      return err(new NotFoundError(`Proiezione con ID '${id}' non trovata`));
    }
    return ok(proiezione);
  }

  async updateProiezione(id: string, data: Partial<CreateProiezioneInput>) {
    // 1. Verifichiamo l'esistenza della proiezione
    const proiezioneResult = await this.findProiezioneById(id);
    if (!proiezioneResult.success) {
      return proiezioneResult;
    }
    const proiezioneEsistente = proiezioneResult.data;
    const updateData: Partial<CreateProiezioneRepoInput> = {};

    const salaIdTarget = data.sala_id || proiezioneEsistente.sala_id;
    const nuovoFilmId = data.film_id || proiezioneEsistente.film_id;
    const nuovaDataInizioStr = data.data_ora_inizio;

    let dataInizioTarget = new Date(proiezioneEsistente.data_ora_inizio);
    let dataFineTarget = new Date(proiezioneEsistente.data_ora_fine);

    if (data.sala_id) {
      updateData.sala_id = data.sala_id;
    }

    // Se stiamo cambiando orario o film, ricalcoliamo la fine
    if (nuovaDataInizioStr || data.film_id) {
      const film = await this.filmRepository.findById(nuovoFilmId);
      if (!film) {
        return err(new NotFoundError(`Film con ID ${nuovoFilmId} non trovato.`));
      }

      dataInizioTarget = nuovaDataInizioStr
        ? new Date(nuovaDataInizioStr)
        : new Date(proiezioneEsistente.data_ora_inizio);

      const durataTotaleMinuti = film.durata_minuti + ProiezioneService.TEMPO_PULIZIA_MINUTI;

      dataFineTarget = new Date(
        dataInizioTarget.getTime() +
          durataTotaleMinuti * ProiezioneService.MILLISECONDS_IN_A_MINUTE,
      );

      updateData.data_ora_inizio = dataInizioTarget;
      updateData.data_ora_fine = dataFineTarget;
      updateData.film_id = nuovoFilmId;
    }

    // 2. LOGICA DI BUSINESS: Verifica conflitti se cambiamo sala o orario (escludendo l'ID attuale)
    if (data.sala_id || nuovaDataInizioStr || data.film_id) {
      const occupata = await this.proiezioneRepository.isSalaOccupata(
        salaIdTarget,
        dataInizioTarget,
        dataFineTarget,
        id, // Passiamo l'ID corrente per non andare in conflitto con se stessa
      );

      if (occupata) {
        return err(
          new ConflictError('Impossibile aggiornare: la sala è occupata nel nuovo orario/giorno'),
        );
      }
    }

    const proiezioneAggiornata = await this.proiezioneRepository.update(id, updateData);

    // 3. Invalidazione Cache per la vecchia data e la nuova data (in caso di spostamento di giorno)
    const vecchiaDataFormatted = new Date(proiezioneEsistente.data_ora_inizio)
      .toISOString()
      .split('T')[0];
    const nuovaDataFormatted = dataInizioTarget.toISOString().split('T')[0];

    await invalidatePalinsestoCache(vecchiaDataFormatted);
    if (vecchiaDataFormatted !== nuovaDataFormatted) {
      await invalidatePalinsestoCache(nuovaDataFormatted);
    }

    return ok(proiezioneAggiornata);
  }

  async updateProiezioneExistence(id: string, input: UpdateProiezioneExistenceInput) {
    const proiezioneResult = await this.findProiezioneById(id);
    if (!proiezioneResult.success) {
      return proiezioneResult;
    }

    const updated = await this.proiezioneRepository.updateExistence(id, input);

    const dataFormatted = new Date(proiezioneResult.data.data_ora_inizio)
      .toISOString()
      .split('T')[0];
    await invalidatePalinsestoCache(dataFormatted);

    return ok(updated);
  }

  async findAll(page: number, limit: number) {
    const result = await this.proiezioneRepository.findAll(page, limit);
    return ok(result);
  }

  async getPalinsestoByDate(dataStr: string) {
    const dateFormatted = dataStr.includes('T') ? dataStr.split('T')[0] : dataStr;
    const cacheKey = buildPalinsestoCacheKey(dateFormatted);

    // 1. Cache HIT
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return ok({
        source: 'cache',
        proiezioni: JSON.parse(cachedData),
      });
    }

    // 2. Cache MISS -> Lettura dal Repository
    const proiezioni = await this.proiezioneRepository.findByData(dateFormatted);

    // 3. Salvataggio in Cache
    await redisClient.set(cacheKey, JSON.stringify(proiezioni), 'EX', PALINSESTO_TTL_SECONDS);

    return ok({
      source: 'db',
      proiezioni,
    });
  }
}
