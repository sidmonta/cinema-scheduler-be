import type { FilmPaginationQuery } from "../schemas/film.schema.js";
import type { FilmService } from "../services/film.service.js";
import type { Request, Response } from "express";

export class FilmController {
  constructor(private readonly filmService: FilmService) {}

  create = async (req: Request, res: Response) => {
    const film = await this.filmService.createFilm(req.body);
    res.status(201).json({ data: film });
  };

  getById = async (req: Request<{ id: string }>, res: Response) => {
    const film = await this.filmService.getFilmById(req.params.id);
    res.status(200).json({ data: film });
  };

  getAll = async (req: Request, res: Response) => {
    const query = req.query as unknown as FilmPaginationQuery;
    const result = await this.filmService.getAllFilms(query);
    res.status(200).json(result);
  };

  update = async (req: Request, res: Response) => {
    const updatedFilm = await this.filmService.updateFilm(
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ data: updatedFilm });
  };

  delete = async (req: Request, res: Response) => {
    await this.filmService.deleteFilm(req.params.id as string, req.body);
    res.status(204).send();
  };
}
