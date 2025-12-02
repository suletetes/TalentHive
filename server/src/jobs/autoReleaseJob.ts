import { autoReleaseEscrowPayments } from '@/controllers/adminTransactionController';

// Auto-release escrow payments job
// This should be called by a cron scheduler (e.g., node-cron, agenda, or external service)
// Default: Run daily at midnight

export const runAutoReleaseJob = async () => {
  console.log('[CRON] Starting auto-release escrow job...');
  try {
    const result = await autoReleaseEscrowPayments();
    console.log(`[CRON] Auto-release completed. Released ${result.released} transactions.`);
    return result;
  } catch (error) {
    console.error('[CRON] Auto-release job failed:', error);
    throw error;
  }
};

// Setup function to initialize the cron job
// Call this from your main server file if you want automatic scheduling
export const setupAutoReleaseSchedule = () => {
  // Using setInterval for simplicity - in production, use node-cron or similar
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  // Run immediately on startup
  runAutoReleaseJob().catch(console.error);
  
  // Then run every 24 hours
  setInterval(() => {
    runAutoReleaseJob().catch(console.error);
  }, TWENTY_FOUR_HOURS);
  
  console.log('[CRON] Auto-release job scheduled to run every 24 hours');
};
