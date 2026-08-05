import { eq, count } from "drizzle-orm";
import { film } from "../db/schema.js";
import type { CreateFilmInput, UpdateFilmInput } from "../schemas/film.schema.js";
import { db } from "../config/drizzle.config.connection.js";


export class FilmRepository {
  async create(data: CreateFilmInput) {
    const [newFilm] = await db.insert(film).values({
      ...data,
      durata_minuti: data.durataMinuti,
    }).returning();
    return newFilm;
  }

  async findById(id: string) {
    const [foundFilm] = await db.select().from(film).where(eq(film.id, id));
    return foundFilm || null;
  }

  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const data = await db.select().from(film).limit(limit).offset(offset);
    
    const [{ total }] = await db.select({ total: count() }).from(film);

    return {
      data,
      meta: {
        page,
        limit,
        totalRecords: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  async update(id: string, data: UpdateFilmInput) {
    const [updatedFilm] = await db
      .update(film)
      .set({ ...data, aggiornata_il: new Date() })
      .where(eq(film.id, id))
      .returning();

    return updatedFilm || null;
  }

    async updateExistence(id: string, data: { eliminata: boolean }) {
    const [updatedFilm] = await db
      .update(film)
      .set({ ...data, aggiornata_il: new Date() })
      .where(eq(film.id, id))
      .returning();
    return updatedFilm || null;
    }

  /*
  async delete(id: string): Promise<boolean> {
    const [deletedFilm] = await db.delete(film).where(eq(film.id, id)).returning({ id: film.id });
    return !!deletedFilm;
  }
    */
}