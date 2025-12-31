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
  
  // Enhanced error handling with retry logic
  const runJobWithRetry = async (attempt = 1, maxAttempts = 3) => {
    try {
      await runAutoReleaseJob();
    } catch (error) {
      console.error(`[CRON] Auto-release job failed (attempt ${attempt}/${maxAttempts}):`, error);
      
      if (attempt < maxAttempts) {
        const retryDelay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
        console.log(`[CRON] Retrying in ${retryDelay}ms...`);
        setTimeout(() => runJobWithRetry(attempt + 1, maxAttempts), retryDelay);
      } else {
        console.error('[CRON] Auto-release job failed after all retry attempts. Manual intervention may be required.');
        // In production, you might want to send an alert here (email, Slack, etc.)
        // await sendAlert('Auto-release job failed after all retries', error);
      }
    }
  };
  
  // Run immediately on startup
  runJobWithRetry();
  
  // Then run every 24 hours
  setInterval(() => {
    runJobWithRetry();
  }, TWENTY_FOUR_HOURS);
  
  console.log('[CRON] Auto-release job scheduled to run every 24 hours with retry logic');
};
