import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  contract: mongoose.Types.ObjectId;
  milestone?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  amount: number; // Total amount in CENTS (smallest currency unit)
  platformCommission: number; // Commission in CENTS
  processingFee: number; // Processing fee in CENTS
  tax: number; // Tax in CENTS
  freelancerAmount: number; // Amount freelancer receives in CENTS
  currency: string;
  status: 'pending' | 'processing' | 'held_in_escrow' | 'released' | 'refunded' | 'failed' | 'cancelled' | 'paid_out';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'other';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeTransferId?: string;
  stripeRefundId?: string;
  escrowReleaseDate?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  paidOutAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    contract: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      index: true,
    },
    milestone: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformCommission: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    processingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    freelancerAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'held_in_escrow', 'released', 'refunded', 'failed', 'cancelled', 'paid_out'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer', 'other'],
      default: 'stripe',
    },
    stripePaymentIntentId: {
      type: String,
    },
    stripeChargeId: {
      type: String,
      sparse: true,
    },
    stripeTransferId: {
      type: String,
      sparse: true,
    },
    stripeRefundId: {
      type: String,
      sparse: true,
    },
    escrowReleaseDate: {
      type: Date,
    },
    releasedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    paidOutAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
