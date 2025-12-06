import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { paymentService } from '../services/payment.service';
import { Transaction } from '../models/Transaction';
import { Contract } from '../models/Contract';
import { notificationService } from '../services/notification.service';

export const transactionController = {
  // Create payment intent
  createPaymentIntent: async (req: AuthRequest, res: Response) => {
    try {
      const { contractId, milestoneId, amount } = req.body;
      const userId = req.user?._id;

      if (!contractId || !amount) {
        return res.status(400).json({
          status: 'error',
          message: 'Contract ID and amount are required',
        });
      }

      // Verify contract exists and user is the client
      const contract = await Contract.findById(contractId).populate('client', 'email');

      if (!contract) {
        return res.status(404).json({
          status: 'error',
          message: 'Contract not found',
        });
      }

      const contractClientId = (contract.client as any)._id?.toString() || contract.client.toString();
      const currentUserId = userId?.toString();
      console.log('[PAYMENT] Contract client ID:', contractClientId);
      console.log('[PAYMENT] Current user ID:', currentUserId);
      console.log('[PAYMENT] Contract client email:', (contract.client as any).email);
      console.log('[PAYMENT] Match:', contractClientId === currentUserId);

      if (contractClientId !== currentUserId) {
        return res.status(403).json({
          status: 'error',
          message: `Only the client can make payments. Contract client: ${(contract.client as any).email || contractClientId}`,
        });
      }

      // Extract IDs properly whether populated or not
      const clientId = (contract.client as any)._id?.toString() || contract.client.toString();
      const freelancerId = (contract.freelancer as any)._id?.toString() || contract.freelancer.toString();
      
      const result = await paymentService.createPaymentIntent(
        contractId,
        amount,
        clientId,
        freelancerId,
        milestoneId
      );

      res.json({
        status: 'success',
        message: 'Payment intent created successfully',
        data: {
          transaction: result.transaction,
          clientSecret: result.clientSecret,
        },
      });
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create payment intent',
        error: error.message,
      });
    }
  },

  // Confirm payment (webhook handler)
  confirmPayment: async (req: AuthRequest, res: Response) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          status: 'error',
          message: 'Payment intent ID is required',
        });
      }

      const transaction = await paymentService.confirmPayment(paymentIntentId);

      // Send notification to freelancer
      try {
        await notificationService.notifyPaymentReceived(
          transaction.freelancer.toString(),
          transaction.amount,
          transaction.contract.toString()
        );
      } catch (error) {
        console.error('Failed to send payment notification:', error);
      }

      res.json({
        status: 'success',
        message: 'Payment confirmed and held in escrow',
        data: transaction,
      });
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to confirm payment',
        error: error.message,
      });
    }
  },

  // Release escrow
  releaseEscrow: async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user?._id;

      const transaction = await Transaction.findById(transactionId).populate('contract');

      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transaction not found',
        });
      }

      // Only client or admin can release escrow
      const contract = transaction.contract as any;
      if (contract.client.toString() !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized to release escrow',
        });
      }

      const updatedTransaction = await paymentService.releaseEscrow(transactionId);

      // Send notification to freelancer
      try {
        await notificationService.notifyEscrowReleased(
          updatedTransaction.freelancer.toString(),
          updatedTransaction.freelancerAmount,
          updatedTransaction.contract.toString()
        );
      } catch (error) {
        console.error('Failed to send escrow release notification:', error);
      }

      res.json({
        status: 'success',
        message: 'Escrow released successfully',
        data: updatedTransaction,
      });
    } catch (error: any) {
      console.error('Release escrow error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to release escrow',
        error: error.message,
      });
    }
  },

  // Refund payment
  refundPayment: async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;
      const userId = req.user?._id;

      const transaction = await Transaction.findById(transactionId).populate('contract');

      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transaction not found',
        });
      }

      // Only client or admin can refund
      const contract = transaction.contract as any;
      if (contract.client.toString() !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized to refund payment',
        });
      }

      const updatedTransaction = await paymentService.refundPayment(transactionId, reason);

      res.json({
        status: 'success',
        message: 'Payment refunded successfully',
        data: updatedTransaction,
      });
    } catch (error: any) {
      console.error('Refund payment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to refund payment',
        error: error.message,
      });
    }
  },

  // Get transaction history
  getTransactionHistory: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;
      const role = req.user?.role as 'client' | 'freelancer';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (role !== 'client' && role !== 'freelancer') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid user role for transaction history',
        });
      }

      const result = await paymentService.getTransactionHistory(userId!, role, page, limit);

      res.json({
        status: 'success',
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Get transaction history error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get transaction history',
        error: error.message,
      });
    }
  },

  // Get transaction by ID
  getTransactionById: async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user?.userId;

      const transaction = await Transaction.findById(transactionId)
        .populate('contract', 'title')
        .populate('client', 'profile.firstName profile.lastName email')
        .populate('freelancer', 'profile.firstName profile.lastName email');

      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transaction not found',
        });
      }

      // Check authorization
      if (
        transaction.client.toString() !== userId &&
        transaction.freelancer.toString() !== userId &&
        req.user?.role !== 'admin'
      ) {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized to view this transaction',
        });
      }

      res.json({
        status: 'success',
        data: transaction,
      });
    } catch (error: any) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get transaction',
        error: error.message,
      });
    }
  },

  // Calculate fees (public endpoint)
  calculateFees: async (req: AuthRequest, res: Response) => {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid amount is required',
        });
      }

      const fees = await paymentService.calculateFees(amount);

      res.json({
        status: 'success',
        data: fees,
      });
    } catch (error: any) {
      console.error('Calculate fees error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to calculate fees',
        error: error.message,
      });
    }
  },
};
