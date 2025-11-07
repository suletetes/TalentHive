import mongoose, { Schema } from 'mongoose';
import { INotification, INotificationPreference } from '@/types/notification';

const notificationSchema = new Schema<INotification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['project', 'proposal', 'contract', 'payment', 'message', 'review', 'system'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },
  link: String,
  data: Schema.Types.Mixed,
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: Date,
}, {
  timestamps: true,
});

const notificationPreferenceSchema = new Schema<INotificationPreference>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  email: {
    projectUpdates: { type: Boolean, default: true },
    proposalUpdates: { type: Boolean, default: true },
    contractUpdates: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },
  push: {
    projectUpdates: { type: Boolean, default: true },
    proposalUpdates: { type: Boolean, default: true },
    contractUpdates: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const NotificationPreference = mongoose.model<INotificationPreference>('NotificationPreference', notificationPreferenceSchema);