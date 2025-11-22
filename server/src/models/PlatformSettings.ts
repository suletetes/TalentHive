import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  commissionRate: number; // Percentage (e.g., 10 for 10%)
  minCommission: number; // Minimum commission in cents
  maxCommission: number; // Maximum commission in cents
  paymentProcessingFee: number; // Percentage
  currency: string;
  taxRate: number; // Percentage
  withdrawalMinAmount: number; // Minimum withdrawal amount in cents
  withdrawalFee: number; // Flat fee in cents
  escrowHoldDays: number; // Days to hold payment in escrow
  refundPolicy: string;
  termsOfService: string;
  privacyPolicy: string;
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 10,
    },
    minCommission: {
      type: Number,
      required: true,
      min: 0,
      default: 100, // $1.00
    },
    maxCommission: {
      type: Number,
      required: true,
      min: 0,
      default: 1000000, // $10,000
    },
    paymentProcessingFee: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 2.9, // Stripe standard
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    withdrawalMinAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 1000, // $10.00
    },
    withdrawalFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    escrowHoldDays: {
      type: Number,
      required: true,
      min: 0,
      default: 7,
    },
    refundPolicy: {
      type: String,
      default: 'Standard refund policy applies.',
    },
    termsOfService: {
      type: String,
      default: 'Terms of service content.',
    },
    privacyPolicy: {
      type: String,
      default: 'Privacy policy content.',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one active settings document exists
platformSettingsSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
