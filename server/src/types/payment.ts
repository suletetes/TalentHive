import { Document, ObjectId } from 'mongoose';

export interface IPayment extends Document {
  contract: ObjectId;
  milestone: ObjectId;
  client: ObjectId;
  freelancer: ObjectId;
  amount: number;
  currency: string;
  type: 'milestone_payment' | 'bonus' | 'refund' | 'withdrawal';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  escrowReleaseDate?: Date;
  platformFee: number;
  freelancerAmount: number;
  metadata: {
    description?: string;
    clientNotes?: string;
    adminNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IEscrowAccount extends Document {
  user: ObjectId;
  stripeAccountId: string;
  accountType: 'client' | 'freelancer';
  balance: number;
  currency: string;
  status: 'pending' | 'active' | 'restricted' | 'suspended';
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  payoutMethods: IPayoutMethod[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayoutMethod extends Document {
  _id: ObjectId;
  type: 'bank_account' | 'debit_card' | 'paypal';
  isDefault: boolean;
  stripePaymentMethodId?: string;
  details: {
    last4?: string;
    bankName?: string;
    accountType?: string;
    country?: string;
  };
  status: 'active' | 'inactive' | 'verification_required';
  createdAt: Date;
}

export interface ITransaction extends Document {
  payment: ObjectId;
  type: 'charge' | 'transfer' | 'payout' | 'refund' | 'fee';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  stripeTransactionId: string;
  description: string;
  metadata: any;
  createdAt: Date;
}

export interface IPaymentWebhook extends Document {
  stripeEventId: string;
  eventType: string;
  processed: boolean;
  data: any;
  processingError?: string;
  createdAt: Date;
}

export interface IPaymentAnalytics {
  totalVolume: number;
  totalFees: number;
  successfulPayments: number;
  failedPayments: number;
  averageTransactionAmount: number;
  topPaymentMethods: Array<{
    method: string;
    count: number;
    volume: number;
  }>;
}