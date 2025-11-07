import { Document, ObjectId } from 'mongoose';

export interface INotification extends Document {
  user: ObjectId;
  type: 'project' | 'proposal' | 'contract' | 'payment' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  link?: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationPreference extends Document {
  user: ObjectId;
  email: {
    projectUpdates: boolean;
    proposalUpdates: boolean;
    contractUpdates: boolean;
    paymentUpdates: boolean;
    messages: boolean;
    reviews: boolean;
    marketing: boolean;
  };
  push: {
    projectUpdates: boolean;
    proposalUpdates: boolean;
    contractUpdates: boolean;
    paymentUpdates: boolean;
    messages: boolean;
    reviews: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}