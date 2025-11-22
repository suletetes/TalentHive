import mongoose, { Schema } from 'mongoose';
import { IPayment, IEscrowAccount, IPayoutMethod, ITransaction, IPaymentWebhook } from '@/types/payment';

const payoutMethodSchema = new Schema<IPayoutMethod>({
  type: {
    type: String,
    enum: ['bank_account', 'debit_card', 'paypal'],
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  stripePaymentMethodId: String,
  details: {
    last4: String,
    bankName: String,
    accountType: String,
    country: String,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'verification_required'],
    default: 'active',
  },
}, {
  timestamps: true,
});

const escrowAccountSchema = new Schema<IEscrowAccount>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  stripeAccountId: {
    type: String,
    required: true,
    unique: true,
  },
  accountType: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'restricted', 'suspended'],
    default: 'pending',
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified',
  },
  payoutMethods: [payoutMethodSchema],
}, {
  timestamps: true,
});

const paymentSchema = new Schema<IPayment>({
  contract: {
    type: Schema.Types.ObjectId,
    ref: 'Contract',
    required: true,
  },
  milestone: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
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
  type: {
    type: String,
    enum: ['milestone_payment', 'bonus', 'refund', 'withdrawal'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
  },
  stripePaymentIntentId: String,
  stripeTransferId: String,
  escrowReleaseDate: Date,
  platformFee: {
    type: Number,
    required: true,
    min: 0,
  },
  freelancerAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  metadata: {
    description: String,
    clientNotes: String,
    adminNotes: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const transactionSchema = new Schema<ITransaction>({
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  },
  type: {
    type: String,
    enum: ['charge', 'transfer', 'payout', 'refund', 'fee'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending',
  },
  stripeTransactionId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
});

const paymentWebhookSchema = new Schema<IPaymentWebhook>({
  stripeEventId: {
    type: String,
    required: true,
    unique: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  processed: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  },
  processingError: String,
}, {
  timestamps: true,
});

// Indexes for better performance
paymentSchema.index({ contract: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ freelancer: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

// Note: user and stripeAccountId already have unique indexes from schema definition
escrowAccountSchema.index({ status: 1 });

transactionSchema.index({ payment: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ stripeTransactionId: 1 });

// Note: stripeEventId already has unique index from schema definition
paymentWebhookSchema.index({ processed: 1 });
paymentWebhookSchema.index({ createdAt: -1 });

// Virtual for net amount after platform fee
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.platformFee;
});

// Method to calculate platform fee (5% default)
paymentSchema.methods.calculatePlatformFee = function(feePercentage = 0.05) {
  this.platformFee = Math.round(this.amount * feePercentage);
  this.freelancerAmount = this.amount - this.platformFee;
  return this.platformFee;
};

// Method to check if payment can be processed
paymentSchema.methods.canBeProcessed = function() {
  return this.status === 'pending' && this.stripePaymentIntentId;
};

// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function() {
  return ['completed'].includes(this.status) && 
         new Date().getTime() - this.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days
};

// Pre-save middleware to calculate fees
paymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    this.calculatePlatformFee();
  }
  next();
});

// Pre-save middleware to set escrow release date
paymentSchema.pre('save', function(next) {
  if (this.isNew && this.type === 'milestone_payment') {
    // Set escrow release date to 7 days from now
    this.escrowReleaseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Post-init hook to calculate fees for newly created documents (not yet saved)
paymentSchema.post('init', function() {
  if (!this.platformFee && this.amount) {
    this.calculatePlatformFee();
  }
  if (!this.escrowReleaseDate && this.type === 'milestone_payment') {
    this.escrowReleaseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
});

// Also calculate on document creation (before save)
paymentSchema.pre('validate', function(next) {
  if (!this.platformFee && this.amount) {
    this.calculatePlatformFee();
  }
  if (!this.escrowReleaseDate && this.type === 'milestone_payment') {
    this.escrowReleaseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export const EscrowAccount = mongoose.model<IEscrowAccount>('EscrowAccount', escrowAccountSchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export const PaymentWebhook = mongoose.model<IPaymentWebhook>('PaymentWebhook', paymentWebhookSchema);