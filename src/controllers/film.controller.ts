import type { FilmService } from '../services/film.service.js';
import type { Request, Response } from 'express';

export class FilmController {
  constructor(private readonly filmService: FilmService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const film = await this.filmService.createFilm(res.locals.body);
    res.status(201).json({ data: film });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const film = await this.filmService.getFilmById(res.locals.params.id);
    res.status(200).json({ data: film });
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = res.locals.query;
    const result = await this.filmService.getAllFilms({ page, limit });
    res.status(200).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const updatedFilm = await this.filmService.updateFilm(res.locals.params.id, res.locals.body);
    res.status(200).json({ data: updatedFilm });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.filmService.deleteFilm(res.locals.params.id);
    res.status(204).send();
  };
}
