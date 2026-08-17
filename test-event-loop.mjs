import { performance } from 'node:perf_hooks';

const BASE_URL = 'http://localhost:3000';

async function measureHealth(label) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[HEALTH CHECK - ${label}] Status: ${res.status} | Tempo impiegato: ${duration} ms`);
    return Number(duration);
  } catch (err) {
    console.error(`[HEALTH CHECK - ${label}] Errore:`, err.message);
    return null;
  }
}

async function runTest() {
  console.log('=== TEST DI IMPATTO SULL\'EVENT LOOP ===\n');

  // 1. Misurazione baseline (Server a riposo)
  console.log('1. Misurazione latenza /health a riposo...');
  const baselineLatency = await measureHealth('BASELINE');
  
  console.log('\n2. Avvio richiesta pesante al report + /health in parallelo...\n');

  const reportStart = performance.now();

  // 2. Lancio in parallelo: Report (pesante) e Health Probe
  const [reportResult, healthResult] = await Promise.allSettled([
    // Richiesta pesante
    fetch(`${BASE_URL}/api/v1/statistiche?anno=2026&mese=8`).then(async (res) => {
      const reportDuration = (performance.now() - reportStart).toFixed(2);
      console.log(`[REPORT STATISTICHE] Status: ${res.status} | Tempo totale report: ${reportDuration} ms`);
      return reportDuration;
    }),

    // Probe inviata 5ms dopo l'inizio del report per intercettare il blocco
    new Promise((resolve) => {
      setTimeout(async () => {
        const healthDuration = await measureHealth('DURANTE REPORT');
        resolve(healthDuration);
      }, 5);
    })
  ]);

  console.log('\n=== RISULTATI DEL TEST ===');
  const durationDuringReport = healthResult.value;

  if (baselineLatency && durationDuringReport) {
    const incremento = (durationDuringReport - baselineLatency).toFixed(2);
    console.log(`• Latenza /health normale:     ${baselineLatency} ms`);
    console.log(`• Latenza /health con blocco:  ${durationDuringReport} ms`);
    console.log(`• Rallentamento della sonda:   +${incremento} ms`);

    if (durationDuringReport > 50) {
      console.log('\n DETECTED: L\'algoritmo sincrono sta bloccando l\'Event Loop di Node.js!');
    } else {
      console.log('\n L\'impatto sull\'Event Loop è contenuto (volume dati ridotto).');
    }
  }
}

runTest();