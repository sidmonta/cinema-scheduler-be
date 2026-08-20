import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ProiezioneService } from '../../src/services/proiezione.service.js';
import type { ProiezioneRepository } from '../../src/repositories/proiezione.repository.js';
import type { FilmRepository } from '../../src/repositories/film.repository.js';
import type { SaleRepository } from '../../src/repositories/sale.repository.js';
import type { UtenteRepository } from '../../src/repositories/utente.repository.js';
import type { Email } from '../../src/utils/email.utils.js';
import { redisClient } from '../../src/config/redis.config.js';
import type { InferSelectModel } from 'drizzle-orm';
import type { proiezione } from '../../src/db/schema.js';

type ProiezioneModel = InferSelectModel<typeof proiezione>;

type ProiezioneDettaglioList = Awaited<ReturnType<ProiezioneRepository['findByData']>>;

vi.mock('../../src/config/redis.config.js', () => ({
  redisClient: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../../src/utils/cache.utils.js', () => ({
  buildPalinsestoCacheKey: (date: string): string => `palinsesto:${date}`,
  invalidatePalinsestoCache: vi.fn(),
  PALINSESTO_TTL_SECONDS: 3600,
}));

describe('ProiezioneService', (): void => {
  let proiezioneService: ProiezioneService;
  let proiezioneRepoMock: Mocked<ProiezioneRepository>;
  let filmRepoMock: Mocked<FilmRepository>;
  let salaRepoMock: Mocked<SaleRepository>;
  let utenteRepoMock: Mocked<UtenteRepository>;
  let emailMock: Mocked<Email>;

  beforeEach(async (): Promise<void> => {
    vi.clearAllMocks();

    proiezioneRepoMock = {
      findById: vi.fn(),
      findByData: vi.fn(),
      isSalaOccupata: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateExistence: vi.fn(),
      findAll: vi.fn(),
    } as unknown as Mocked<ProiezioneRepository>;

    filmRepoMock = {
      findById: vi.fn(),
    } as unknown as Mocked<FilmRepository>;

    salaRepoMock = {
      findById: vi.fn(),
    } as unknown as Mocked<SaleRepository>;

    utenteRepoMock = {
      findAllPerProiezione: vi.fn(),
    } as unknown as Mocked<UtenteRepository>;

    emailMock = {
      notificaSequenziale: vi.fn().mockResolvedValue(undefined),
      notificaParallelo: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<Email>;

    proiezioneService = new ProiezioneService(
      proiezioneRepoMock,
      filmRepoMock,
      salaRepoMock,
      utenteRepoMock,
      emailMock,
    );
  });

  describe('createProiezione', (): void => {
    const inputData = {
      sala_id: 'sala-1',
      film_id: 'film-1',
      data_ora_inizio: '2026-09-01T20:00:00.000Z',
    };

    it('dovrebbe creare una proiezione con successo calcolando la durata + tempo pulizia', async (): Promise<void> => {
      filmRepoMock.findById.mockResolvedValue({
        id: 'film-1',
        titolo: 'Inception',
        durata_minuti: 120,
        genere: 'Sci-Fi',
        classificazione: '14+',
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
      });

      salaRepoMock.findById.mockResolvedValue({
        id: 'sala-1',
        cinema_id: 'cinema-1',
        nome: 'Sala 1',
        righe: 10,
        colonne: 10,
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
        capienza: 100,
      });

      proiezioneRepoMock.isSalaOccupata.mockResolvedValue(false);

      const fakeProiezione: ProiezioneModel = {
        id: 'proiezione-1',
        sala_id: 'sala-1',
        film_id: 'film-1',
        data_ora_inizio: new Date(inputData.data_ora_inizio),
        data_ora_fine: new Date('2026-09-01T22:15:00.000Z'),
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
      };

      proiezioneRepoMock.create.mockResolvedValue(fakeProiezione);

      const result = await proiezioneService.createProiezione(inputData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('proiezione-1');
      }
      expect(proiezioneRepoMock.isSalaOccupata).toHaveBeenCalledWith(
        'sala-1',
        new Date('2026-09-01T20:00:00.000Z'),
        new Date('2026-09-01T22:15:00.000Z'),
      );
    });

    it('dovrebbe restituire ConflictError se la sala è occupata', async (): Promise<void> => {
      filmRepoMock.findById.mockResolvedValue({
        id: 'film-1',
        titolo: 'Inception',
        durata_minuti: 120,
        genere: 'Sci-Fi',
        classificazione: '14+',
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
      });

      salaRepoMock.findById.mockResolvedValue({
        id: 'sala-1',
        cinema_id: 'cinema-1',
        nome: 'Sala 1',
        righe: 10,
        colonne: 10,
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
        capienza: 100,
      });

      proiezioneRepoMock.isSalaOccupata.mockResolvedValue(true);

      const result = await proiezioneService.createProiezione(inputData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
        expect(result.error.message).toContain('occupata');
      }
      expect(proiezioneRepoMock.create).not.toHaveBeenCalled();
    });

    it('dovrebbe restituire NotFoundError se il film non esiste', async (): Promise<void> => {
      filmRepoMock.findById.mockResolvedValue(null);

      const result = await proiezioneService.createProiezione(inputData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getPalinsestoByDate', (): void => {
    it('dovrebbe restituire i dati dalla cache (Cache HIT) senza interrogare il DB', async (): Promise<void> => {
      const cachedProiezioni = [{ proiezioneId: 'p-1', film: { titolo: 'Inception' } }];
      vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(cachedProiezioni));

      const result = await proiezioneService.getPalinsestoByDate('2026-09-01');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('cache');
        expect(result.data.proiezioni).toEqual(cachedProiezioni);
      }
      expect(proiezioneRepoMock.findByData).not.toHaveBeenCalled();
    });

    it('dovrebbe interrogare il DB e popolare Redis (Cache MISS)', async (): Promise<void> => {
      vi.mocked(redisClient.get).mockResolvedValue(null);

      const dbProiezioni: ProiezioneDettaglioList = [
        {
          proiezioneId: 'p-1',
          dataOraInizio: new Date('2026-09-01T20:00:00.000Z'),
          dataOraFine: new Date('2026-09-01T22:15:00.000Z'),
          film: {
            id: 'f-1',
            titolo: 'Inception',
            durataMinuti: 120,
            genere: 'Sci-Fi',
            classificazione: '14+',
          },
          sala: {
            id: 's-1',
            nome: 'Sala 1',
            righe: 10,
            colonne: 10,
            capienza: 100,
          },
        } as unknown as ProiezioneDettaglioList[number],
      ];

      proiezioneRepoMock.findByData.mockResolvedValue(dbProiezioni);

      const result = await proiezioneService.getPalinsestoByDate('2026-09-01');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('db');
        expect(result.data.proiezioni).toBe(dbProiezioni);
      }
      expect(proiezioneRepoMock.findByData).toHaveBeenCalledWith('2026-09-01');
      expect(redisClient.set).toHaveBeenCalledWith(
        'palinsesto:2026-09-01',
        JSON.stringify(dbProiezioni),
        'EX',
        3600,
      );
    });
  });
});
