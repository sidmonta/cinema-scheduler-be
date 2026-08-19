import { runCsvSeed } from './seeding.js';

async function run(): Promise<void> {
  try {
    await runCsvSeed();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante il seeding da CSV:', error);
    process.exit(1);
  }
}

run();
