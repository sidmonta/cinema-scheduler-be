import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { FilmService } from '../../src/services/film.service.js';
import type { FilmRepository } from '../../src/repositories/film.repository.js';
import { NotFoundError } from '../config/app-error.js';

describe('FilmService', (): void => {
  let filmService: FilmService;
  let filmRepoMock: Mocked<FilmRepository>;

  beforeEach((): void => {
    vi.clearAllMocks();

    filmRepoMock = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<FilmRepository>;

    filmService = new FilmService(filmRepoMock);
  });

  describe('getFilmById', (): void => {
    it('dovrebbe restituire il film se esiste', async (): Promise<void> => {
      const mockFilm = {
        id: 'film-1',
        titolo: 'Interstellar',
        durata_minuti: 169,
        genere: 'Sci-Fi',
        classificazione: '14+' as const,
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
      };

      filmRepoMock.findById.mockResolvedValue(mockFilm);

      const result = await filmService.getFilmById('film-1');

      expect(result).toBeDefined();
      expect(result?.titolo).toBe('Interstellar');
      expect(filmRepoMock.findById).toHaveBeenCalledWith('film-1');
    });

    it('dovrebbe restituire NotFoundError se il film non esiste', async (): Promise<void> => {
      filmRepoMock.findById.mockResolvedValue(null);

      await expect(filmService.getFilmById('film-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createFilm', (): void => {
    it('dovrebbe creare un nuovo film con successo', async (): Promise<void> => {
      const inputData = {
        titolo: 'Dune: Part Two',
        durataMinuti: 166,
        genere: 'Sci-Fi',
        classificazione: '18+' as const,
      };

      const createdFilm = {
        id: 'film-2',
        titolo: inputData.titolo,
        durata_minuti: inputData.durataMinuti, // Nel modello DB torna in snake_case se la tabella lo richiede
        genere: inputData.genere,
        classificazione: inputData.classificazione,
        eliminata: false,
        creata_il: new Date(),
        aggiornata_il: new Date(),
      };

      filmRepoMock.create.mockResolvedValue(createdFilm);

      const result = await filmService.createFilm(inputData);

      expect(result).toBeDefined();
      expect(result.id).toBe('film-2');
      expect(filmRepoMock.create).toHaveBeenCalledWith(inputData);
    });
  });
});
