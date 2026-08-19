import { and, count, eq } from 'drizzle-orm';
import { db } from '../config/drizzle.config.connection.js';
import { prenotazione } from '../db/schema.js';

export interface CreatePrenotazioneRepoInput {
  utente_id: string;
  proiezione_id: string;
  riga: number;
  colonna: number;
  stato?: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
}

export interface PrenotazioniPaginate {
  data: Array<typeof prenotazione.$inferSelect>;
  totalRecords: number;
}

export type CreateConConcorrenzaResult =
  | { success: true; data: typeof prenotazione.$inferSelect }
  | { success: false; reason: 'POSTO_OCCUPATO' | 'CONCORRENZA_POSTO_OCCUPATO' };

export class PrenotazioneRepository {
  // 1. Creazione con gestione della concorrenza (Race Condition)
  async createConConcorrenza(
    data: CreatePrenotazioneRepoInput,
  ): Promise<CreateConConcorrenzaResult> {
    return await db.transaction(async (tx) => {
      // 1. Verifichiamo se il posto è libero
      const [existing] = await tx
        .select()
        .from(prenotazione)
        .where(
          and(
            eq(prenotazione.proiezione_id, data.proiezione_id),
            eq(prenotazione.riga, data.riga),
            eq(prenotazione.colonna, data.colonna),
            eq(prenotazione.eliminata, false),
          ),
        )
        .limit(1);

      if (existing) {
        return { success: false, reason: 'POSTO_OCCUPATO' as const };
      }

      // 2. Proviamo l'inserimento
      try {
        const [nuovaPrenotazione] = await tx
          .insert(prenotazione)
          .values({
            utente_id: data.utente_id,
            proiezione_id: data.proiezione_id,
            riga: data.riga,
            colonna: data.colonna,
            stato: data.stato ?? 'PENDING',
          })
          .returning();

        return { success: true, data: nuovaPrenotazione };
      } catch (error) {
        const pgError = error as { code?: string };
        if (pgError.code === '23505') {
          return { success: false, reason: 'CONCORRENZA_POSTO_OCCUPATO' as const };
        }
        throw error;
      }
    });
  }

  // 2. Recupero lista prenotazioni di un utente specifico (con paginazione)
  async findByUtenteId(
    utenteId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PrenotazioniPaginate> {
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(prenotazione)
      .where(and(eq(prenotazione.utente_id, utenteId), eq(prenotazione.eliminata, false)))
      .limit(limit)
      .offset(offset);

    const [{ totale }] = await db
      .select({ totale: count() })
      .from(prenotazione)
      .where(and(eq(prenotazione.utente_id, utenteId), eq(prenotazione.eliminata, false)));

    return {
      data,
      totalRecords: Number(totale),
    };
  }

  // 3. Recupero singola prenotazione per ID
  async findByIdAndUtenteId(
    id: string,
    utenteId: string,
  ): Promise<typeof prenotazione.$inferSelect | null> {
    const [result] = await db
      .select()
      .from(prenotazione)
      .where(
        and(
          eq(prenotazione.id, id),
          eq(prenotazione.utente_id, utenteId),
          eq(prenotazione.eliminata, false),
        ),
      )
      .limit(1);

    return result || null;
  }

  // 4. Annullamento / Eliminazione Logica (Soft Delete)
  async softDelete(id: string, utenteId: string): Promise<typeof prenotazione.$inferSelect | null> {
    const [updated] = await db
      .update(prenotazione)
      .set({
        eliminata: true,
        stato: 'CANCELLED',
        aggiornata_il: new Date(),
      })
      .where(
        and(
          eq(prenotazione.id, id),
          eq(prenotazione.utente_id, utenteId),
          eq(prenotazione.eliminata, false),
        ),
      )
      .returning();

    return updated || null;
  }

  async countByProiezioneId(proiezioneId: string): Promise<number> {
    const [{ totale }] = await db
      .select({ totale: count() })
      .from(prenotazione)
      .where(and(eq(prenotazione.proiezione_id, proiezioneId), eq(prenotazione.eliminata, false)));

    return Number(totale);
  }

  async findByProiezioneId(
    proiezioneId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PrenotazioniPaginate> {
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(prenotazione)
      .where(and(eq(prenotazione.proiezione_id, proiezioneId), eq(prenotazione.eliminata, false)))
      .limit(limit)
      .offset(offset);

    const [{ totale }] = await db
      .select({ totale: count() })
      .from(prenotazione)
      .where(and(eq(prenotazione.proiezione_id, proiezioneId), eq(prenotazione.eliminata, false)));

    return {
      data,
      totalRecords: Number(totale),
    };
  }
}
