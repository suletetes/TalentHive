import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionSetting {
  name: string;
  commissionPercentage: number;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  isActive: boolean;
}

export interface ISettings extends Document {
  commissionSettings: ICommissionSetting[];
  platformFee: number;
  escrowPeriodDays: number;
  minWithdrawalAmount: number;
  maintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSettingSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  commissionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  minAmount: {
    type: Number,
    min: 0,
  },
  maxAmount: {
    type: Number,
    min: 0,
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const settingsSchema = new Schema<ISettings>({
  commissionSettings: [commissionSettingSchema],
  platformFee: {
    type: Number,
    required: true,
    default: 5,
    min: 0,
    max: 100,
  },
  escrowPeriodDays: {
    type: Number,
    required: true,
    default: 7,
    min: 0,
  },
  minWithdrawalAmount: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
  },
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
