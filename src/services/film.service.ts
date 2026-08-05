import { NotFoundError } from "../config/app-error.js";
import type { FilmRepository } from "../repositories/film.repository.js";
import type { CreateFilmInput, FilmPaginationQuery, UpdateFilmExistenceInput, UpdateFilmInput } from "../schemas/film.schema.js";


export class FilmService {
  constructor(private readonly filmRepository: FilmRepository) {}

  async createFilm(input: CreateFilmInput) {
    return await this.filmRepository.create(input);
  }

  async getFilmById(id: string) {
    const film = await this.filmRepository.findById(id);
    if (!film) {
      throw new NotFoundError(`Film con ID '${id}' non trovato`);
    }
    return film;
  }

  async getAllFilms(query: FilmPaginationQuery) {
    const { page, limit } = query;
    return await this.filmRepository.findAll(page, limit);
  }

  async updateFilm(id: string, input: UpdateFilmInput) {
    // Verifica prima l'esistenza
    await this.getFilmById(id);
    return await this.filmRepository.update(id, input);
  }

  async deleteFilm(id: string, input: UpdateFilmExistenceInput) {
    // Verifica prima l'esistenza
    await this.getFilmById(id);
    await this.filmRepository.updateExistence(id, input);
  }
}