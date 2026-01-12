import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'message' | 'proposal' | 'contract' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata: {
    projectId?: mongoose.Types.ObjectId;
    proposalId?: mongoose.Types.ObjectId;
    contractId?: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    amount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['message', 'proposal', 'contract', 'payment', 'review', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    metadata: {
      projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
      proposalId: {
        type: Schema.Types.ObjectId,
        ref: 'Proposal',
      },
      contractId: {
        type: Schema.Types.ObjectId,
        ref: 'Contract',
      },
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      amount: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
