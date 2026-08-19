import { ok, err, type Result } from '../config/result.type.js';
import { ConflictError, NotFoundError, type AppError } from '../config/app-error.js';
import type { FilmRepository } from '../repositories/film.repository.js';
import type {
  ProiezioneRepository,
  CreateProiezioneRepoInput,
} from '../repositories/proiezione.repository.js';
import type { CreateProiezioneInput } from '../schemas/proiezione.schema.js';
import {
  buildPalinsestoCacheKey,
  invalidatePalinsestoCache,
  PALINSESTO_TTL_SECONDS,
} from '../utils/cache.utils.js';
import { redisClient } from '../config/redis.config.js';
import type { SaleRepository } from '../repositories/sale.repository.js';
import type { UtenteRepository } from '../repositories/utente.repository.js';
import type { Email } from '../utils/email.utils.js';

type ProiezioneEntity = NonNullable<Awaited<ReturnType<ProiezioneRepository['findById']>>>;

export interface PalinsestoResponse {
  source: 'cache' | 'db';
  proiezioni: Awaited<ReturnType<ProiezioneRepository['findByData']>>;
}

export class ProiezioneService {
  constructor(
    private readonly proiezioneRepository: ProiezioneRepository,
    private readonly filmRepository: FilmRepository,
    private readonly salaRepository: SaleRepository,
    private readonly utenteRepository: UtenteRepository,
    private readonly email: Email,
  ) {}

  private static readonly MILLISECONDS_IN_A_MINUTE = 60000;
  private static readonly TEMPO_PULIZIA_MINUTI = 15;

  async createProiezione(data: CreateProiezioneInput): Promise<Result<ProiezioneEntity, AppError>> {
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

  async findProiezioneById(id: string): Promise<Result<ProiezioneEntity, AppError>> {
    const proiezione = await this.proiezioneRepository.findById(id);
    if (!proiezione) {
      return err(new NotFoundError(`Proiezione con ID '${id}' non trovata`));
    }
    return ok(proiezione);
  }

  async updateProiezione(
    id: string,
    data: Partial<CreateProiezioneInput>,
  ): Promise<Result<Awaited<ReturnType<ProiezioneRepository['update']>>, AppError>> {
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
      const sala = await this.salaRepository.findById(data.sala_id);
      if (!sala) {
        return err(new NotFoundError(`Sala con ID: ${data.sala_id} non trovata`));
      }
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

  async updateProiezioneExistence(
    id: string,
  ): Promise<Result<Awaited<ReturnType<ProiezioneRepository['updateExistence']>>, AppError>> {
    const proiezioneResult = await this.findProiezioneById(id);
    if (!proiezioneResult.success) {
      return proiezioneResult;
    }
    const updated = await this.proiezioneRepository.updateExistence(id);
    const dataFormatted = new Date(proiezioneResult.data.data_ora_inizio)
      .toISOString()
      .split('T')[0];
    await invalidatePalinsestoCache(dataFormatted);
    const clientiPaginati = await this.utenteRepository.findAllPerProiezione(1, 10, id);
    const clienti = clientiPaginati.data;

    // SEQUENZIALE
    const startSeq = Date.now();
    await this.email.notificaSequenziale(clienti, id);
    const timeSeq = Date.now() - startSeq;

    // PARALLELO
    const startPar = Date.now();
    await this.email.notificaParallelo(clienti, id);
    const timePar = Date.now() - startPar;

    console.log(` SEQUENZIALE: ${timeSeq} ms`);
    console.log(` PARALLELO:   ${timePar} ms`);

    return ok(updated);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<Result<Awaited<ReturnType<ProiezioneRepository['findAll']>>, AppError>> {
    const result = await this.proiezioneRepository.findAll(page, limit);
    return ok(result);
  }

  async getPalinsestoByDate(dataStr: string): Promise<Result<PalinsestoResponse, AppError>> {
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
