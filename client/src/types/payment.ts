// Payment-related types

export type TransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'held_in_escrow' 
  | 'released' 
  | 'refunded' 
  | 'failed' 
  | 'cancelled';

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
  status: TransactionStatus;
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

export interface PaymentIntentResponse {
  status: string;
  message: string;
  data: {
    transaction: Transaction;
    clientSecret: string;
  };
}

export interface ConfirmPaymentDto {
  paymentIntentId: string;
}

export interface RefundPaymentDto {
  reason?: string;
}

export interface PaymentFilters {
  status?: TransactionStatus;
  contractId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

export interface PaymentStats {
  totalEarnings: number;
  totalSpent: number;
  pendingPayments: number;
  completedTransactions: number;
  averageTransactionAmount: number;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface PaymentHistory {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}