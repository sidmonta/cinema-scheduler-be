import { performance as Date } from 'node:perf_hooks';

const BASE_URL = 'http://localhost:3000';

async function measureHealth(label) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const duration = (Date.now() - start).toFixed(2);
    console.log(`[HEALTH CHECK - ${label}] Status: ${res.status} | Tempo impiegato: ${duration} ms`);
    return Number(duration);
  } catch (err) {
    console.error(`[HEALTH CHECK - ${label}] Errore:`, err.message);
    return null;
  }
}

async function runTest() {
  console.log('=== TEST DI IMPATTO SULL\'EVENT LOOP ===\n');
  let healthStart = Date.now();

  // 1. Misurazione baseline (Server a riposo)
  console.log('1. Misurazione latenza /health a riposo...');
  const baselineLatency = await fetch(`${BASE_URL}/health`).then(async (res) => {
      const healthDuration = (Date.now() - healthStart).toFixed(2);
      console.log(`[HEALTH] Status: ${res.status} | Tempo totale chiamata: ${healthDuration} ms`);
      return healthDuration;
    });

  console.log('1. Misurazione latenza /health seconda chiamata dopo "risveglio"...');
  healthStart = Date.now();
  const baselineLatency2 = await fetch(`${BASE_URL}/health`).then(async (res) => {
      const healthDuration = (Date.now() - healthStart).toFixed(2);
      console.log(`[HEALTH] Status: ${res.status} | Tempo totale chiamata: ${healthDuration} ms`);
      return healthDuration;
    })
  
  console.log('\n2. Avvio richiesta pesante al report\n');
  let reportStart = Date.now();
  const reportLatency = await fetch(`${BASE_URL}/api/v1/statistiche?anno=2026&mese=8`).then(async (res) => {
      const reportDuration = (Date.now() - reportStart).toFixed(2);
      console.log(`[REPORT] Status: ${res.status} | Tempo totale chiamata: ${reportDuration} ms`);
      return reportDuration;
    })


  console.log('\n2. Avvio richiesta pesante al report + /health in parallelo...\n');
  reportStart = Date.now();
  healthStart = Date.now();

  const [reportResult, healthResult] = await Promise.all([
    // Richiesta pesante
    fetch(`${BASE_URL}/api/v1/statistiche?anno=2026&mese=8`).then(async (res) => {
      const reportDuration2 = (Date.now() - reportStart).toFixed(2);
      console.log(res);
      console.log(`[REPORT STATISTICHE] Status: ${res.status} | Tempo totale report: ${reportDuration2} ms`);
      return reportDuration2;
    }),

    fetch(`${BASE_URL}/health`).then(async (res) => {
      const healthDuration2 = (Date.now() - healthStart).toFixed(2);
      console.log(`[HEALTH] Status: ${res.status} | Tempo totale chiamata: ${healthDuration2} ms`);
      return healthDuration2;
    }),
  ]);

  console.log('\n=== RISULTATI DEL TEST ===');

  if (baselineLatency) {
    console.log(`• Latenza /health (dormiente):     ${baselineLatency} ms`);
    console.log(`• Latenza /health (svegliato):     ${baselineLatency2} ms`);
    console.log(`• Latenza report:  ${reportLatency} ms`);
    console.log(`• Latenza report + /health (report):  ${reportResult} ms`);
    console.log(`• Latenza report + /health (health):  ${healthResult} ms`);
    console.log(`• Differenza tempi di /health:  ${baselineLatency2 - healthResult} ms`);

    if (reportLatency > 50) {
      console.log('\n DETECTED: L\'algoritmo sincrono sta bloccando l\'Event Loop di Node.js!');
    } else {
      console.log('\n L\'impatto sull\'Event Loop è contenuto (volume dati ridotto).');
    }
  }
}

runTest().then(console.log).catch(console.error);