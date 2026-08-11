import { db } from '../config/drizzle.config.connection.js';
import { eq, count, and, gt, lt, gte, lte, ne } from 'drizzle-orm';
import { proiezione, film, sala } from '../db/schema.js';

export interface CreateProiezioneRepoInput {
  sala_id: string;
  film_id: string;
  data_ora_inizio: Date;
  data_ora_fine: Date;
}

export class ProiezioneRepository {
  async create(data: CreateProiezioneRepoInput) {
    const [newProiezione] = await db
      .insert(proiezione)
      .values({
        sala_id: data.sala_id,
        film_id: data.film_id,
        data_ora_inizio: data.data_ora_inizio,
        data_ora_fine: data.data_ora_fine,
      })
      .returning();

    return newProiezione;
  }

  async findById(id: string) {
    const [foundProiezione] = await db.select().from(proiezione).where(eq(proiezione.id, id));

    return foundProiezione || null;
  }

  async findByData(data: string) {
    const dayStart = new Date(`${data}T00:00:00.000Z`);
    const dayEnd = new Date(`${data}T23:59:59.999Z`);

    return await db
      .select({
        proiezioneId: proiezione.id,
        dataOraInizio: proiezione.data_ora_inizio,
        dataOraFine: proiezione.data_ora_fine,
        film: {
          id: film.id,
          titolo: film.titolo,
          durata: film.durata_minuti,
          genere: film.genere,
          classificazione: film.classificazione,
        },
        sala: {
          id: sala.id,
          nome: sala.nome,
        },
      })
      .from(proiezione)
      .innerJoin(film, eq(proiezione.film_id, film.id))
      .innerJoin(sala, eq(proiezione.sala_id, sala.id))
      .where(
        and(
          eq(proiezione.eliminata, false),
          gte(proiezione.data_ora_inizio, dayStart),
          lte(proiezione.data_ora_inizio, dayEnd),
        ),
      );
  }

  async isSalaOccupata(
    sala_id: string,
    inizio: Date,
    fine: Date,
    excludeProiezioneId?: string, // Utile in caso di UPDATE per escludere la proiezione stessa
  ): Promise<boolean> {
    const conditions = [
      eq(proiezione.sala_id, sala_id),
      eq(proiezione.eliminata, false),
      lt(proiezione.data_ora_inizio, fine),
      gt(proiezione.data_ora_fine, inizio),
    ];

    if (excludeProiezioneId) {
      conditions.push(ne(proiezione.id, excludeProiezioneId));
    }

    const [found] = await db
      .select({ id: proiezione.id })
      .from(proiezione)
      .where(and(...conditions))
      .limit(1);

    return !!found;
  }

  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const data = await db
      .select()
      .from(proiezione)
      .where(eq(proiezione.eliminata, false))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(proiezione)
      .where(eq(proiezione.eliminata, false));

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

  async update(id: string, data: Partial<CreateProiezioneRepoInput>) {
    const [updatedProiezione] = await db
      .update(proiezione)
      .set({ ...data, aggiornata_il: new Date() })
      .where(eq(proiezione.id, id))
      .returning();

    return updatedProiezione || null;
  }

  async updateExistence(id: string, data: { eliminata: boolean }) {
    const [updatedProiezione] = await db
      .update(proiezione)
      .set({ ...data, aggiornata_il: new Date() })
      .where(eq(proiezione.id, id))
      .returning();

    return updatedProiezione || null;
  }

  async findProiezioneConCapacita(proiezioneId: string) {
    const [result] = await db
      .select({
        proiezioneId: proiezione.id,
        capacita: sala.capienza,
      })
      .from(proiezione)
      .innerJoin(sala, eq(proiezione.sala_id, sala.id))
      .where(and(eq(proiezione.id, proiezioneId), eq(proiezione.eliminata, false)));

    return result || null;
  }
}
