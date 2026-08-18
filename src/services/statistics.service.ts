import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import { db } from '../config/drizzle.config.connection.js';
import { sala, proiezione, prenotazione } from '../db/schema.js';
import type { PrenotazioneRepository } from '../repositories/prenotazione.repository.js';
import type { ProiezioneRepository } from '../repositories/proiezione.repository.js';
import type { SaleRepository } from '../repositories/sale.repository.js';

interface GeneraMatriceParams {
  riga: number;
  colonna: number;
  prenotazioni: Array<{ riga: number; colonna: number }>;
}

export class StatisticsService {
  constructor(
    private readonly prenotazioneRepository: PrenotazioneRepository,
    private readonly proiezioneRepository: ProiezioneRepository,
    private readonly salaRepository: SaleRepository,
  ) {}

  /**
   * Generatore helper sincrono per la matrice 2D dei posti.
   */
  generaMatricePosti({ riga, colonna, prenotazioni }: GeneraMatriceParams): number[][] {
    const matrice: number[][] = Array.from({ length: riga }, () =>
      Array.from({ length: colonna }, () => 0),
    );

    for (const p of prenotazioni) {
      const rigaIdx = p.riga - 1;
      const colonnaIdx = p.colonna - 1;

      if (rigaIdx >= 0 && rigaIdx < riga && colonnaIdx >= 0 && colonnaIdx < colonna) {
        matrice[rigaIdx][colonnaIdx] = 1;
      }
    }

    return matrice;
  }

  /**
   * 1. REPORT LISTA (Leggero & Fast)
   * Restituisce le statistiche mensili per tutte le proiezioni SENZA generare le matrici.
   * Evita il sovraccarico di memoria e sblocca l'interfaccia Swagger UI.
   */
  async statisticsSql(anno: number, mese: number) {
    const inizioMese = new Date(anno, mese - 1, 1, 0, 0, 0);
    const fineMese = new Date(anno, mese, 0, 23, 59, 59);

    const proiezioniStat = await db
      .select({
        proiezioneId: proiezione.id,
        salaId: proiezione.sala_id,
        nomeSala: sala.nome,
        dataOra: proiezione.data_ora_inizio,
        capienzaTotale: sala.capienza,
        postiOccupati: count(prenotazione.id),
        percentualeOccupazione: sql<number>`
          COALESCE(
            ROUND((COUNT(${prenotazione.id})::decimal / ${sala.capienza}) * 100, 2)::float,
            0
          )
        `,
      })
      .from(proiezione)
      .leftJoin(
        prenotazione,
        and(
          eq(prenotazione.proiezione_id, proiezione.id),
          eq(prenotazione.stato, 'CONFIRMED'),
          eq(prenotazione.eliminata, false),
        ),
      )
      .leftJoin(sala, eq(proiezione.sala_id, sala.id))
      .where(
        and(
          eq(proiezione.eliminata, false),
          gte(proiezione.data_ora_inizio, inizioMese),
          lte(proiezione.data_ora_inizio, fineMese),
        ),
      )
      .groupBy(
        proiezione.id,
        proiezione.sala_id,
        sala.nome,
        proiezione.data_ora_inizio,
        sala.capienza,
      );

    return proiezioniStat;
  }

  /**
   * 2. DETTAGLIO MATRICE (On-Demand)
   * Calcola ed estrae la matrice 2D per UNA singola proiezione specifica.
   */
  async getMatriceProiezione(proiezioneId: string) {
    // A. Recupera la proiezione con le informazioni della relativa sala
    const [proiezioneConSala] = await db
      .select({
        proiezioneId: proiezione.id,
        salaId: proiezione.sala_id,
        nomeSala: sala.nome,
        dataOraInizio: proiezione.data_ora_inizio,
        righe: sala.righe,
        colonne: sala.colonne,
        capienza: sala.capienza,
      })
      .from(proiezione)
      .innerJoin(sala, eq(proiezione.sala_id, sala.id))
      .where(and(eq(proiezione.id, proiezioneId), eq(proiezione.eliminata, false)));

    if (!proiezioneConSala) {
      return null;
    }

    // B. Estrai solo i posti occupati per QUESTA specifica proiezione
    const postiPrenotati = await db
      .select({
        riga: prenotazione.riga,
        colonna: prenotazione.colonna,
      })
      .from(prenotazione)
      .where(
        and(
          eq(prenotazione.proiezione_id, proiezioneId),
          eq(prenotazione.stato, 'CONFIRMED'),
          eq(prenotazione.eliminata, false),
        ),
      );

    // C. Calcola la matrice 2D
    const numRighe = proiezioneConSala.righe ?? 0;
    const numColonne = proiezioneConSala.colonne ?? 0;

    const matrice = this.generaMatricePosti({
      riga: numRighe,
      colonna: numColonne,
      prenotazioni: postiPrenotati,
    });

    const postiOccupatiCount = postiPrenotati.length;
    const capienzaTotale = proiezioneConSala.capienza ?? numRighe * numColonne;
    const percentuale =
      capienzaTotale > 0 ? Number(((postiOccupatiCount / capienzaTotale) * 100).toFixed(2)) : 0;

    return {
      proiezioneId: proiezioneConSala.proiezioneId,
      salaId: proiezioneConSala.salaId,
      nomeSala: proiezioneConSala.nomeSala,
      dataOraInizio: proiezioneConSala.dataOraInizio,
      postiOccupati: postiOccupatiCount,
      capienzaTotale,
      percentualeOccupazione: percentuale,
      matriceOccupazione: matrice,
    };
  }
}
