import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { 
  createMockTransaction, 
  createMockTransactionsForFreelancer, 
  cleanupMockTransactions,
  getDevStatus 
} from '../utils/devHelpers';

const router = Router();

// Only enable dev routes in development
if (process.env.NODE_ENV === 'development' || process.env.MOCK_STRIPE_CONNECT === 'true') {
  
  // Get development status for current user
  router.get('/status', auth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const status = await getDevStatus(userId);
      
      res.json({
        status: 'success',
        data: status,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  // Create a single mock transaction
  router.post('/mock-transaction', auth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { amount, status = 'released' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Amount must be greater than 0',
        });
      }

      const transaction = await createMockTransaction(userId, amount, status);
      
      res.json({
        status: 'success',
        message: `Created mock transaction of $${amount} with status '${status}'`,
        data: { transaction },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  // Create multiple mock transactions
  router.post('/mock-transactions', auth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Transactions array is required',
        });
      }

      const createdTransactions = await createMockTransactionsForFreelancer(userId, transactions);
      
      res.json({
        status: 'success',
        message: `Created ${createdTransactions.length} mock transactions`,
        data: { transactions: createdTransactions },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  // Clean up all mock transactions
  router.delete('/mock-transactions', auth, async (req: Request, res: Response) => {
    try {
      const deletedCount = await cleanupMockTransactions();
      
      res.json({
        status: 'success',
        message: `Cleaned up ${deletedCount} mock transactions`,
        data: { deletedCount },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  // Quick setup for testing withdrawals
  router.post('/setup-withdrawal-test', auth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      
      // Create some mock transactions in different states
      const transactions = await createMockTransactionsForFreelancer(userId, [
        { amount: 100, status: 'released' },
        { amount: 250, status: 'released' },
        { amount: 75, status: 'held_in_escrow' },
        { amount: 50, status: 'paid_out' },
      ]);
      
      res.json({
        status: 'success',
        message: 'Created test transactions for withdrawal testing',
        data: {
          transactions,
          summary: {
            available: '$350 (2 released transactions)',
            inEscrow: '$75 (1 transaction)',
            paidOut: '$50 (1 transaction)',
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

} else {
  // In production, return 404 for all dev routes
  router.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      message: 'Development routes not available in production',
    });
  });
}

export default router;