import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PrenotazioneService } from '../../src/services/prenotazione.service.js';
import type { PrenotazioneRepository } from '../../src/repositories/prenotazione.repository.js';
import type { ProiezioneRepository } from '../../src/repositories/proiezione.repository.js';
import type { SaleRepository } from '../../src/repositories/sale.repository.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../src/config/app-error.js';

describe('PrenotazioneService', (): void => {
  let prenotazioneService: PrenotazioneService;
  let prenotazioneRepoMock: Mocked<PrenotazioneRepository>;
  let proiezioneRepoMock: Mocked<ProiezioneRepository>;
  let salaRepoMock: Mocked<SaleRepository>;

  beforeEach((): void => {
    vi.clearAllMocks();

    prenotazioneRepoMock = {
      createConConcorrenza: vi.fn(),
      findByUtenteId: vi.fn(),
      findByIdAndUtenteId: vi.fn(),
      softDelete: vi.fn(),
      countByProiezioneId: vi.fn(),
      findByProiezioneId: vi.fn(),
    } as unknown as Mocked<PrenotazioneRepository>;

    proiezioneRepoMock = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<ProiezioneRepository>;

    salaRepoMock = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<SaleRepository>;

    prenotazioneService = new PrenotazioneService(
      prenotazioneRepoMock,
      proiezioneRepoMock,
      salaRepoMock,
    );
  });

  describe('create', (): void => {
    const userId = 'user-1';
    const payload = {
      proiezioneId: 'proiezione-1',
      riga: 2,
      colonna: 4,
      stato: 'CONFIRMED' as const,
    };

    const mockProiezione = {
      id: 'proiezione-1',
      sala_id: 'sala-1',
      film_id: 'film-1',
      data_ora_inizio: new Date(Date.now() + 86400000),
      data_ora_fine: new Date(Date.now() + 90000000),
      eliminata: false,
      creata_il: new Date(),
      aggiornata_il: new Date(),
    };

    const mockSala = {
      id: 'sala-1',
      nome: 'Sala IMAX',
      capienza: 100,
      righe: 10,
      colonne: 10,
      eliminata: false,
      creata_il: new Date(),
      aggiornata_il: new Date(),
      cinema_id: 'cinema-1',
    };

    it('dovrebbe creare la prenotazione con successo', async (): Promise<void> => {
      proiezioneRepoMock.findById.mockResolvedValue(mockProiezione);
      prenotazioneRepoMock.countByProiezioneId.mockResolvedValue(10);
      salaRepoMock.findById.mockResolvedValue(mockSala);

      const mockCreated = {
        id: 'prenotazione-1',
        utente_id: userId,
        proiezione_id: payload.proiezioneId,
        riga: payload.riga,
        colonna: payload.colonna,
        stato: 'PENDING' as const,
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
      };

      prenotazioneRepoMock.createConConcorrenza.mockResolvedValue({
        success: true,
        data: mockCreated,
      });

      const result = await prenotazioneService.create(userId, payload);

      expect(result.id).toBe('prenotazione-1');
      expect(prenotazioneRepoMock.createConConcorrenza).toHaveBeenCalledWith({
        utente_id: userId,
        proiezione_id: payload.proiezioneId,
        riga: payload.riga,
        colonna: payload.colonna,
        stato: payload.stato,
      });
    });

    it('dovrebbe lanciare NotFoundError se la proiezione non esiste', async (): Promise<void> => {
      proiezioneRepoMock.findById.mockResolvedValue(null);

      await expect(prenotazioneService.create(userId, payload)).rejects.toThrow(NotFoundError);
    });

    it('dovrebbe lanciare ForbiddenError se la sala è sold out', async (): Promise<void> => {
      proiezioneRepoMock.findById.mockResolvedValue(mockProiezione);
      prenotazioneRepoMock.countByProiezioneId.mockResolvedValue(100);
      salaRepoMock.findById.mockResolvedValue({ ...mockSala, capienza: 100 });

      await expect(prenotazioneService.create(userId, payload)).rejects.toThrow(ForbiddenError);
    });

    it('dovrebbe lanciare ForbiddenError se il posto supera le dimensioni della sala', async (): Promise<void> => {
      proiezioneRepoMock.findById.mockResolvedValue(mockProiezione);
      prenotazioneRepoMock.countByProiezioneId.mockResolvedValue(10);
      salaRepoMock.findById.mockResolvedValue(mockSala);

      const invalidPayload = { ...payload, riga: 99 };

      await expect(prenotazioneService.create(userId, invalidPayload)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('dovrebbe lanciare ConflictError se il posto è già occupato', async (): Promise<void> => {
      proiezioneRepoMock.findById.mockResolvedValue(mockProiezione);
      prenotazioneRepoMock.countByProiezioneId.mockResolvedValue(10);
      salaRepoMock.findById.mockResolvedValue(mockSala);

      prenotazioneRepoMock.createConConcorrenza.mockResolvedValue({
        success: false,
        reason: 'POSTO_OCCUPATO',
      });

      await expect(prenotazioneService.create(userId, payload)).rejects.toThrow(ConflictError);
    });
  });

  describe('getPrenotazioniByUser', (): void => {
    it("dovrebbe restituire le prenotazioni paginate dell'utente", async (): Promise<void> => {
      const mockPaginated = {
        data: [
          {
            id: 'prenotazione-1',
            utente_id: 'user-1',
            proiezione_id: 'proiezione-1',
            riga: 1,
            colonna: 2,
            stato: 'CONFIRMED' as const,
            eliminata: false,
            creata_il: new Date(),
            aggiornata_il: new Date(),
          },
        ],
        totalRecords: 1,
      };

      prenotazioneRepoMock.findByUtenteId.mockResolvedValue(mockPaginated);

      const result = await prenotazioneService.getPrenotazioniByUser('user-1', 1, 10);

      expect(result.data.length).toBe(1);
      expect(result.meta.totalRecords).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('delete', (): void => {
    const userId = 'user-1';
    const prenotazioneId = 'prenotazione-1';

    const mockPrenotazione = {
      id: prenotazioneId,
      utente_id: userId,
      proiezione_id: 'proiezione-1',
      riga: 1,
      colonna: 2,
      stato: 'PENDING' as const,
      eliminata: false,
      creata_il: new Date(),
      aggiornata_il: new Date(),
    };

    it("dovrebbe annullare la prenotazione se l'orario limite (2 ore prima) è rispettato", async (): Promise<void> => {
      // Inizio proiezione fra 5 ore
      const mockProiezioneInFuturo = {
        id: 'proiezione-1',
        sala_id: 'sala-1',
        film_id: 'film-1',
        data_ora_inizio: new Date(Date.now() + 5 * 60 * 60 * 1000),
        data_ora_fine: new Date(Date.now() + 7 * 60 * 60 * 1000),
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
      };

      prenotazioneRepoMock.findByIdAndUtenteId.mockResolvedValue(mockPrenotazione);
      proiezioneRepoMock.findById.mockResolvedValue(mockProiezioneInFuturo);
      prenotazioneRepoMock.softDelete.mockResolvedValue({ ...mockPrenotazione, eliminata: true });

      const result = await prenotazioneService.delete(prenotazioneId, userId);

      expect(result).toBe(true);
      expect(prenotazioneRepoMock.softDelete).toHaveBeenCalledWith(prenotazioneId, userId);
    });

    it('dovrebbe lanciare ForbiddenError se si tenta di cancellare meno di 2 ore prima della proiezione', async (): Promise<void> => {
      // Inizio proiezione fra 1 ora
      const mockProiezioneImminente = {
        id: 'proiezione-1',
        sala_id: 'sala-1',
        film_id: 'film-1',
        data_ora_inizio: new Date(Date.now() + 1 * 60 * 60 * 1000),
        data_ora_fine: new Date(Date.now() + 3 * 60 * 60 * 1000),
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
      };

      prenotazioneRepoMock.findByIdAndUtenteId.mockResolvedValue(mockPrenotazione);
      proiezioneRepoMock.findById.mockResolvedValue(mockProiezioneImminente);

      await expect(prenotazioneService.delete(prenotazioneId, userId)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
