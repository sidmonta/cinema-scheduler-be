import { NotFoundError } from '../config/app-error.js';
import type { FilmRepository } from '../repositories/film.repository.js';
import type {
  CreateFilmInput,
  FilmPaginationQuery,
  UpdateFilmInput,
} from '../schemas/film.schema.js';

export class FilmService {
  constructor(private readonly filmRepository: FilmRepository) {}

  async createFilm(input: CreateFilmInput): Promise<Awaited<ReturnType<FilmRepository['create']>>> {
    return await this.filmRepository.create(input);
  }

  async getFilmById(
    id: string,
  ): Promise<NonNullable<Awaited<ReturnType<FilmRepository['findById']>>>> {
    const film = await this.filmRepository.findById(id);
    if (!film) {
      throw new NotFoundError(`Film con ID '${id}' non trovato`);
    }
    return film;
  }

  async getAllFilms(
    query: FilmPaginationQuery,
  ): Promise<Awaited<ReturnType<FilmRepository['findAll']>>> {
    const { page, limit } = query;
    return await this.filmRepository.findAll(page, limit);
  }

  async updateFilm(
    id: string,
    input: UpdateFilmInput,
  ): Promise<Awaited<ReturnType<FilmRepository['update']>>> {
    // Verifica prima l'esistenza
    await this.getFilmById(id);
    return await this.filmRepository.update(id, input);
  }

  async updateFilmExistence(
    id: string,
  ): Promise<Awaited<ReturnType<FilmRepository['updateExistence']>>> {
    // Verifica prima l'esistenza
    await this.getFilmById(id);
    return await this.filmRepository.updateExistence(id);
  }

  async deleteFilm(id: string): Promise<Awaited<ReturnType<FilmRepository['updateExistence']>>> {
    await this.getFilmById(id);
    return await this.filmRepository.updateExistence(id);
  }
}
