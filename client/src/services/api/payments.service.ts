import { apiCore } from './core';

export interface Transaction {
  _id: string;
  contract: string;
  milestone?: string;
  client: string;
  freelancer: string;
  amount: number;
  platformCommission: number;
  processingFee: number;
  tax: number;
  freelancerAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'held_in_escrow' | 'released' | 'refunded' | 'failed' | 'cancelled';
  paymentMethod: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeRefundId?: string;
  escrowReleaseDate?: string;
  releasedAt?: string;
  refundedAt?: string;
  failureReason?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentDto {
  contractId: string;
  milestoneId?: string;
  amount: number;
}

export interface ConfirmPaymentDto {
  paymentIntentId: string;
}

export interface RefundPaymentDto {
  reason?: string;
}

export class PaymentsService {
  private basePath = '/payments';

  /**
   * Create a payment intent for a milestone
   */
  async createPaymentIntent(data: CreatePaymentIntentDto): Promise<{
    status: string;
    message: string;
    data: {
      transaction: Transaction;
      clientSecret: string;
    };
  }> {
    return apiCore.post(`${this.basePath}/create-intent`, data);
  }

  /**
   * Confirm a payment after Stripe processing
   */
  async confirmPayment(data: ConfirmPaymentDto): Promise<{
    status: string;
    message: string;
    data: Transaction;
  }> {
    return apiCore.post(`${this.basePath}/confirm`, data);
  }

  /**
   * Release payment from escrow to freelancer
   */
  async releaseEscrow(transactionId: string): Promise<{
    status: string;
    message: string;
    data: Transaction;
  }> {
    return apiCore.post(`${this.basePath}/${transactionId}/release`, {});
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, data: RefundPaymentDto): Promise<{
    status: string;
    message: string;
    data: Transaction;
  }> {
    return apiCore.post(`${this.basePath}/${transactionId}/refund`, data);
  }

  /**
   * Get transaction history for the current user
   */
  async getTransactionHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    status: string;
    data: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get(`${this.basePath}/transactions?${queryParams.toString()}`);
  }

  /**
   * Get user balance
   */
  async getBalance(): Promise<{
    status: string;
    data: {
      available: number;
      pending: number;
      total: number;
    };
  }> {
    return apiCore.get(`${this.basePath}/balance`);
  }
}

export const paymentsService = new PaymentsService();
