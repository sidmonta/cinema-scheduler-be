const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export interface NotificationResult {
  email: string;
  success: boolean;
  error?: string;
}

export async function inviaEmailSimulata(email: string, proiezioneId: string): Promise<void> {
  await delay(200);
  if (email.includes('error')) {
    throw new Error(`Impossibile inviare email a ${email}`);
  }
  console.log(
    `[SMTP SIMULATED] Email di cancellazione inviata a: ${email} (Proiezione: ${proiezioneId})`,
  );
}

let prova = 0;

export class Email {
  async notificaSequenziale(
    clienti: Array<{ email: string }>,
    proiezioneId: string,
  ): Promise<void> {
    for (const item of clienti) {
      try {
        prova = prova + 1;
        await inviaEmailSimulata(item.email, proiezioneId);
      } catch (err) {
        console.error(`[NOTIFICA FALLITA - SEQ] Email non inviata a ${item.email}:`, err);
      }
    }
    console.log(` CHIAMATE: ${prova} `);
  }

  async notificaParallelo(
    clienti: Array<{ email: string }>,
    proiezioneId: string,
  ): Promise<NotificationResult[]> {
    const notifichePromises = clienti.map(async (item): Promise<NotificationResult> => {
      try {
        await inviaEmailSimulata(item.email, proiezioneId);
        return { email: item.email, success: true };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
        console.error(`[NOTIFICA FALLITA - PAR] Fallimento per ${item.email}: ${errorMsg}`);
        return { email: item.email, success: false, error: errorMsg };
      }
    });

    const risultatiSettled = await Promise.allSettled(notifichePromises);

    return risultatiSettled.map((res) => {
      if (res.status === 'fulfilled') {
        return res.value;
      }
      return { email: 'Sconosciuta', success: false, error: 'Errore durante l execution' };
    });
  }
}
