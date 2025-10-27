import 'dotenv/config';
import cron from 'node-cron';
import { generateCaseSnapshots } from '../src/utils/snapshot';

async function run(year: number, force = false) {
  console.log(`[snapshot-cron] Generating snapshots for year=${year}, force=${force}`);
  try {
    const result = await generateCaseSnapshots(year);
    console.log(`[snapshot-cron] Done. total=${result.total}`);
  } catch (err) {
    console.error('[snapshot-cron] Failed:', err);
  }
}

// Optional: allow manual execution via CLI args: node scripts/snapshot-cron.js --year=2025 --force
const args = process.argv.slice(2);
const argYear = args.find(a => a.startsWith('--year='));
const argForce = args.includes('--force');

if (argYear) {
  const y = Number(argYear.split('=')[1]);
  run(y, argForce);
} else {
  // Schedule at 23:59:59 on Dec 31 every year (system timezone)
  cron.schedule('59 59 23 31 12 *', async () => {
    const now = new Date();
    const year = now.getFullYear();
    await run(year, false);
  }, { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });

  console.log('[snapshot-cron] Scheduled: 23:59:59 on Dec 31 each year.');
}