import { eq, count } from 'drizzle-orm';
import { film } from '../db/schema.js';
import type { CreateFilmInput, UpdateFilmInput } from '../schemas/film.schema.js';
import { db } from '../config/drizzle.config.connection.js';

export interface FilmsPaginate {
  data: Array<typeof film.$inferSelect>;
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export class FilmRepository {
  async create(data: CreateFilmInput): Promise<typeof film.$inferSelect> {
    const { durataMinuti, ...rest } = data;

    const [newFilm] = await db
      .insert(film)
      .values({
        ...rest,
        durata_minuti: durataMinuti,
      })
      .returning();

    return newFilm;
  }

  async findById(id: string): Promise<typeof film.$inferSelect | null> {
    const [foundFilm] = await db.select().from(film).where(eq(film.id, id));
    return foundFilm || null;
  }

  async findAll(page: number, limit: number): Promise<FilmsPaginate> {
    const offset = (page - 1) * limit;

    const data = await db.select().from(film).limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(film);

    const totalRecords = Number(total);

    return {
      data,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  async update(id: string, data: UpdateFilmInput): Promise<typeof film.$inferSelect | null> {
    const { durataMinuti, ...rest } = data;

    const [updatedFilm] = await db
      .update(film)
      .set({
        ...rest,
        ...(durataMinuti !== undefined && { durata_minuti: durataMinuti }),
        aggiornata_il: new Date(),
      })
      .where(eq(film.id, id))
      .returning();

    return updatedFilm || null;
  }

  async updateExistence(id: string): Promise<typeof film.$inferSelect | null> {
    const [updatedFilm] = await db
      .update(film)
      .set({ aggiornata_il: new Date(), eliminata: true })
      .where(eq(film.id, id))
      .returning();

    return updatedFilm || null;
  }
}
