# Contesto di progetto — Multiplex Aurora

## Chi siamo

Multiplex Aurora è una catena cinematografica di medie dimensioni con una sola struttura, situata in un centro commerciale di periferia. Il cinema ha **4 sale**:

| Sala | Capienza | Note |
|------|----------|------|
| Sala 1 | 180 posti (18 file × 10 colonne) | Sala principale, schermo grande, usata per le uscite di punta |
| Sala 2 | 120 posti (12 file × 10 colonne) | |
| Sala 3 | 90 posti (9 file × 10 colonne) | |
| Sala 4 | 60 posti (10 file × 6 colonne) | La più piccola, spesso usata per film di nicchia o repliche |

Il cinema proietta in media 6-8 film diversi a settimana, con più spettacoli al giorno per titolo (tipicamente pomeriggio/sera nei giorni feriali, aggiunta di mattinate nel weekend).

## Il problema che ci ha portati a commissionare questo software

Fino ad oggi il palinsesto delle proiezioni è stato gestito con un foglio Excel condiviso tra il responsabile di sala e la biglietteria, e le prenotazioni telefoniche venivano segnate a mano su un quaderno in biglietteria. Il sistema ha iniziato a mostrare tutti i suoi limiti:

- **Doppie prenotazioni**: due operatori diversi hanno assegnato lo stesso posto a due clienti diversi per lo stesso spettacolo, in più di un'occasione — con conseguente imbarazzo (e rimborsi) alla porta della sala.
- **Sovrapposizioni di sala**: è capitato che due film fossero programmati nella stessa sala con orari che si sovrapponevano, perché chi compilava il foglio non aveva visibilità in tempo reale su cosa avesse già inserito un collega.
- **Nessuna vista consolidata**: il gestore non ha modo rapido di vedere l'occupazione delle sale nei prossimi giorni per decidere se aggiungere spettacoli a un film che sta andando bene.
- **Nessuna storicizzazione**: non c'è modo di capire a posteriori quali film/orari abbiano performato meglio, perché il foglio Excel viene sovrascritto settimana dopo settimana.

## Cosa ci serve

Un **servizio backend** che gestisca in modo centralizzato:

1. L'anagrafica dei film in programmazione (titolo, durata, genere, classificazione per età)
2. La configurazione delle sale (capienza, disposizione posti)
3. Il **palinsesto delle proiezioni**: quale film, in quale sala, a che ora — con la garanzia che il sistema stesso impedisca sovrapposizioni nella stessa sala, cosa che il foglio Excel non ha mai potuto fare
4. Le **prenotazioni** dei clienti, con scelta del posto, e la garanzia che due persone non possano mai finire per prenotare lo stesso posto per lo stesso spettacolo — è il problema più sentito da chi lavora in biglietteria oggi
5. Un minimo di gestione utenti: i clienti si registrano per prenotare, il personale di sala (ruolo admin) gestisce film, sale e palinsesto

Il fatto che il palinsesto venga consultato molto più spesso di quanto venga modificato (i clienti controllano gli orari continuamente, il palinsesto cambia una volta a settimana) è stato esplicitamente segnalato dal team di infrastruttura come un caso adatto a caching: da qui la richiesta di introdurre Redis.

## Vincoli di business da rispettare (raccolti parlando con lo staff)

- Tra una proiezione e la successiva nella stessa sala serve un **buffer di pulizia di 15 minuti**: se un film dura 120 minuti e inizia alle 18:00, la sala è considerata occupata fino alle 20:15, non alle 20:00.
- Una prenotazione può essere **cancellata gratuitamente fino a 3 ore prima** dell'inizio dello spettacolo; dopo, in questa prima versione del sistema, la cancellazione non è permessa (la gestione dei rimborsi oltre questa soglia resterà manuale per ora).
- I film vengono classificati con un **rating d'età** (es. "T", "14+", "18+") — per ora il sistema deve solo registrarlo e mostrarlo, il controllo effettivo in sala resta un processo umano (non è richiesta verifica età in fase di prenotazione, ma è un requisito che potrebbe arrivare in una versione futura).

## Chi userà il sistema

- **Personale di sala / gestore (ruolo `admin`)**: inserisce film, configura sale, crea e modifica il palinsesto
- **Clienti (ruolo `customer`)**: consultano il palinsesto, si registrano, prenotano posti, cancellano prenotazioni entro i termini

## Perché questo backend, e non un tool esistente

Il gestore ha valutato soluzioni SaaS già pronte sul mercato, ma la maggior parte è pensata per catene molto più grandi, con costi di licenza non giustificabili per una singola struttura a 4 sale. Da qui la scelta di sviluppare una soluzione su misura, partendo dal servizio backend: la parte più critica da mettere in sicurezza subito è proprio quella che oggi genera i problemi reali (doppie prenotazioni, sovrapposizioni) — l'interfaccia utente arriverà in una fase successiva del progetto.

---

*Questo documento descrive il contesto di business fittizio usato come riferimento per le user story del progetto didattico. In caso di dubbi su un requisito non specificato, è legittimo e incoraggiato fare ipotesi ragionevoli partendo da questo contesto e documentarle nella PR, esattamente come si farebbe con un cliente reale che non ha pensato a tutti i casi limite.*