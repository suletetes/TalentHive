import { apiCore } from './core';
import { formatPaymentError, isPaymentError, isRetryablePaymentError } from '@/utils/paymentErrors';
import toast from 'react-hot-toast';

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
}

export interface Transaction {
  _id: string;
  contract: string;
  milestone: string;
  amount: number;
  platformCommission: number;
  freelancerAmount: number;
  status: 'pending' | 'processing' | 'held_in_escrow' | 'released' | 'paid_out' | 'failed' | 'cancelled';
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentBreakdown {
  amount: number;
  commission: number;
  freelancerAmount: number;
}

export class PaymentsService {
  private basePath = '/payments';

  /**
   * Create a Stripe Checkout Session (Recommended)
   */
  async createCheckoutSession(contractId: string, milestoneId: string): Promise<{
    checkoutUrl: string;
    sessionId: string;
    transaction: Transaction;
    breakdown: PaymentBreakdown;
  }> {
    try {
      console.log('[PAYMENTS] Creating checkout session:', { contractId, milestoneId });
      
      const response = await apiCore.post<any>(`${this.basePath}/checkout`, {
        contractId,
        milestoneId,
      });
      
      console.log('[PAYMENTS] Checkout session created:', response);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create checkout session');
    } catch (error: any) {
      console.error('[PAYMENTS] Checkout session creation failed:', error);
      
      const formattedError = formatPaymentError(error);
      toast.error(formattedError.message);
      
      throw error;
    }
  }

  /**
   * Create a Payment Intent (Legacy support)
   */
  async createPaymentIntent(contractId: string, milestoneId: string): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    transaction: Transaction;
    breakdown: PaymentBreakdown;
  }> {
    try {
      console.log('[PAYMENTS] Creating payment intent:', { contractId, milestoneId });
      
      const response = await apiCore.post<any>(`${this.basePath}/create-intent`, {
        contractId,
        milestoneId,
      });
      
      console.log('[PAYMENTS] Payment intent created:', response);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create payment intent');
    } catch (error: any) {
      console.error('[PAYMENTS] Payment intent creation failed:', error);
      
      const formattedError = formatPaymentError(error);
      toast.error(formattedError.message);
      
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPayment(paymentIntentId: string): Promise<{ transaction: Transaction }> {
    try {
      console.log('[PAYMENTS] Confirming payment:', paymentIntentId);
      
      const response = await apiCore.post<any>(`${this.basePath}/confirm`, {
        paymentIntentId,
      });
      
      console.log('[PAYMENTS] Payment confirmed:', response);
      
      if (response.status === 'success' && response.data) {
        toast.success('Payment processed successfully!');
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to confirm payment');
    } catch (error: any) {
      console.error('[PAYMENTS] Payment confirmation failed:', error);
      
      const formattedError = formatPaymentError(error);
      toast.error(formattedError.message);
      
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<Transaction> {
    try {
      const response = await apiCore.get<any>(`${this.basePath}/status/${transactionId}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payment status');
    } catch (error: any) {
      console.error('[PAYMENTS] Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Release payment from escrow
   */
  async releasePayment(contractId: string, milestoneId: string): Promise<{ transaction: Transaction }> {
    try {
      console.log('[PAYMENTS] Releasing payment:', { contractId, milestoneId });
      
      const response = await apiCore.post<any>(`${this.basePath}/release`, {
        contractId,
        milestoneId,
      });
      
      console.log('[PAYMENTS] Payment released:', response);
      
      if (response.status === 'success' && response.data) {
        toast.success('Payment released successfully!');
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to release payment');
    } catch (error: any) {
      console.error('[PAYMENTS] Payment release failed:', error);
      
      const formattedError = formatPaymentError(error);
      toast.error(formattedError.message);
      
      throw error;
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(transactionId: string, reason?: string): Promise<{ transaction: Transaction }> {
    try {
      console.log('[PAYMENTS] Cancelling payment:', { transactionId, reason });
      
      const response = await apiCore.post<any>(`${this.basePath}/cancel`, {
        transactionId,
        reason,
      });
      
      console.log('[PAYMENTS] Payment cancelled:', response);
      
      if (response.status === 'success' && response.data) {
        toast.success('Payment cancelled successfully!');
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to cancel payment');
    } catch (error: any) {
      console.error('[PAYMENTS] Payment cancellation failed:', error);
      
      const formattedError = formatPaymentError(error);
      toast.error(formattedError.message);
      
      throw error;
    }
  }

  /**
   * Get transaction history for a contract
   */
  async getTransactionHistory(params?: { limit?: number; contractId?: string }): Promise<{ data: Transaction[] }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.contractId) queryParams.append('contractId', params.contractId);
      
      const response = await apiCore.get<any>(`/transactions/history?${queryParams.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return { data: response.data };
      }
      
      return { data: [] };
    } catch (error: any) {
      console.error('[PAYMENTS] Failed to get transaction history:', error);
      return { data: [] };
    }
  }

  /**
   * Retry a failed payment with exponential backoff
   */
  async retryPayment<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if it's not a retryable error
        if (!isRetryablePaymentError(error)) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[PAYMENTS] Retrying payment operation in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Handle payment webhook events (for client-side status updates)
   */
  handlePaymentWebhook(event: any): void {
    console.log('[PAYMENTS] Webhook event received:', event);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        toast.success('Payment completed successfully!');
        break;
      case 'payment_intent.payment_failed':
        const error = formatPaymentError(event.data.object.last_payment_error);
        toast.error(error.message);
        break;
      case 'checkout.session.completed':
        toast.success('Payment session completed!');
        break;
      case 'checkout.session.expired':
        toast.error('Payment session expired. Please try again.');
        break;
      default:
        console.log('[PAYMENTS] Unhandled webhook event:', event.type);
    }
  }
}

export const paymentsService = new PaymentsService();