import mongoose, { Schema } from 'mongoose';
import { IServicePackage } from '@/types/servicePackage';

const pricingTierSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    deliveryTime: { type: Number, required: true, min: 1 },
    features: [String],
  },
  { _id: false }
);

const servicePackageSchema = new Schema<IServicePackage>(
  {
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    pricing: {
      type: {
        type: String,
        enum: ['fixed', 'hourly', 'custom'],
        required: true,
      },
      amount: { type: Number, min: 0 },
      hourlyRate: { type: Number, min: 0 },
      tiers: [pricingTierSchema],
    },
    deliveryTime: {
      type: Number,
      required: true,
      min: 1,
    },
    revisions: {
      type: Number,
      default: 2,
      min: 0,
    },
    features: [String],
    requirements: [String],
    skills: [String],
    portfolio: [String],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    orders: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
servicePackageSchema.index({ freelancer: 1, isActive: 1 });
servicePackageSchema.index({ category: 1, isActive: 1 });
servicePackageSchema.index({ skills: 1 });

const ServicePackage = mongoose.model<IServicePackage>('ServicePackage', servicePackageSchema);

export default ServicePackage;
