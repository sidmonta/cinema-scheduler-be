import { and, count, eq } from 'drizzle-orm';
import { db } from '../config/drizzle.config.connection.js';
import { prenotazione, utente } from '../db/schema.js';

export interface UtentiPerProiezionePaginati {
  data: Array<{
    id: string;
    email: string;
    utenteId: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export class UtenteRepository {
  async findAllPerProiezione(
    page: number,
    limit: number,
    proiezioneId: string,
  ): Promise<UtentiPerProiezionePaginati> {
    const offset = (page - 1) * limit;

    const whereConditions = and(
      eq(prenotazione.proiezione_id, proiezioneId),
      eq(prenotazione.eliminata, false),
    );

    const data = await db
      .select({
        id: prenotazione.id,
        email: utente.email,
        utenteId: utente.id,
      })
      .from(prenotazione)
      .innerJoin(utente, eq(prenotazione.utente_id, utente.id))
      .where(whereConditions)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(prenotazione)
      .where(whereConditions);

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
}
