import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../config/drizzle.config.connection.js';
import { sala, proiezione, prenotazione } from '../db/schema.js';
import type { PrenotazioneRepository } from '../repositories/prenotazione.repository.js';
import type { ProiezioneRepository } from '../repositories/proiezione.repository.js';
import type { SaleRepository } from '../repositories/sale.repository.js';

export class StatisticsService {
  constructor(
    private readonly prenotazioneRepository: PrenotazioneRepository,
    private readonly proiezioneRepository: ProiezioneRepository,
    private readonly salaRepository: SaleRepository,
  ) {}

  async statistics(anno: number, mese: number) {
    const inizioMese = new Date(anno, mese - 1, 1, 0, 0, 0);
    const fineMese = new Date(anno, mese, 0, 23, 59, 59);

    const saleList = await db.select().from(sala).where(eq(sala.eliminata, false));
    console.log('SALE TROVATE A DB:', saleList.length);

    const proiezioniList = await db
      .select()
      .from(proiezione)
      .where(
        and(
          eq(proiezione.eliminata, false),
          gte(proiezione.data_ora_inizio, inizioMese),
          lte(proiezione.data_ora_inizio, fineMese),
        ),
      );
    console.log('PROIEZIONI TOTALE A DB:', proiezioniList.length);

    const prenotazioniList = await db
      .select()
      .from(prenotazione)
      .where(and(eq(prenotazione.eliminata, false), eq(prenotazione.stato, 'CONFIRMED')));
    console.log('PRENOTAZIONI TOTALE A DB:', prenotazioniList.length);

    const prenotazioniPerProiezione = new Map<string, typeof prenotazioniList>();
    for (const p of prenotazioniList) {
      const list = prenotazioniPerProiezione.get(p.proiezione_id) || [];
      list.push(p);
      prenotazioniPerProiezione.set(p.proiezione_id, list);
    }

    const reportPerSala = [];

    for (const s of saleList) {
      const proiezioniDellaSala = proiezioniList.filter((p) => p.sala_id === s.id);

      let totalePostiDisponibiliSala = 0;
      let totalePostiPrenotatiSala = 0;

      const proiezioniReport = [];

      for (const p of proiezioniDellaSala) {
        const matriceOccupazione: number[][] = Array.from({ length: s.righe }, () =>
          Array(s.colonne).fill(0),
        );

        const prenotazioniProiezione = prenotazioniPerProiezione.get(p.id) || [];

        // Popola la matrice mettendo 1 dove c'è una prenotazione
        for (const pren of prenotazioniProiezione) {
          const rIndex = pren.riga - 1;
          const cIndex = pren.colonna - 1;

          if (rIndex >= 0 && rIndex < s.righe && cIndex >= 0 && cIndex < s.colonne) {
            matriceOccupazione[rIndex][cIndex] = 1;
          }
        }

        let postiOccupatiProiezione = 0;
        for (let r = 0; r < s.righe; r++) {
          for (let c = 0; c < s.colonne; c++) {
            if (matriceOccupazione[r][c] === 1) {
              postiOccupatiProiezione++;
            }
          }
        }

        const capienzaProiezione = s.righe * s.colonne;
        const percentualeOccupazione =
          capienzaProiezione > 0
            ? Number(((postiOccupatiProiezione / capienzaProiezione) * 100).toFixed(2))
            : 0;

        totalePostiDisponibiliSala += capienzaProiezione;
        totalePostiPrenotatiSala += postiOccupatiProiezione;

        proiezioniReport.push({
          proiezioneId: p.id,
          dataInizio: p.data_ora_inizio,
          matriceOccupazione,
          postiOccupati: postiOccupatiProiezione,
          capienzaTotale: capienzaProiezione,
          percentualeOccupazione,
        });
      }

      const percentualeTotaleSala =
        totalePostiDisponibiliSala > 0
          ? Number(((totalePostiPrenotatiSala / totalePostiDisponibiliSala) * 100).toFixed(2))
          : 0;

      reportPerSala.push({
        salaId: s.id,
        nomeSala: s.nome,
        totaleProiezioni: proiezioniDellaSala.length,
        percentualeOccupazioneTotale: percentualeTotaleSala,
        proiezioni: proiezioniReport,
      });
    }
    return reportPerSala;
  }
}
