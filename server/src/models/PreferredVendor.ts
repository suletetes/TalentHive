import mongoose, { Schema } from 'mongoose';
import { IPreferredVendor } from '@/types/servicePackage';

const preferredVendorSchema = new Schema<IPreferredVendor>(
  {
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
    category: String,
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    totalProjects: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    isPriority: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
preferredVendorSchema.index({ client: 1, freelancer: 1 }, { unique: true });
preferredVendorSchema.index({ client: 1, isPriority: 1 });

const PreferredVendor = mongoose.model<IPreferredVendor>('PreferredVendor', preferredVendorSchema);

export default PreferredVendor;
