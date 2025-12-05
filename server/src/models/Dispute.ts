import mongoose, { Schema, Document } from 'mongoose';

export interface IDispute extends Document {
  title: string;
  description: string;
  type: 'project' | 'contract' | 'payment' | 'user' | 'other';
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Parties involved
  complainant: mongoose.Types.ObjectId; // User who filed the dispute
  respondent?: mongoose.Types.ObjectId; // User being complained about
  
  // Related entities
  project?: mongoose.Types.ObjectId;
  contract?: mongoose.Types.ObjectId;
  transaction?: mongoose.Types.ObjectId;
  
  // Evidence and communication
  evidence: string[]; // URLs to uploaded files
  messages: {
    sender: mongoose.Types.ObjectId;
    message: string;
    timestamp: Date;
    isAdminMessage: boolean;
  }[];
  
  // Resolution
  assignedAdmin?: mongoose.Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema<IDispute>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  type: {
    type: String,
    enum: ['project', 'contract', 'payment', 'user', 'other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  complainant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  respondent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
  },
  contract: {
    type: Schema.Types.ObjectId,
    ref: 'Contract',
  },
  transaction: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
  },
  evidence: [String],
  messages: [{
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isAdminMessage: {
      type: Boolean,
      default: false,
    },
  }],
  assignedAdmin: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  resolution: {
    type: String,
    maxlength: 2000,
  },
  resolvedAt: Date,
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
disputeSchema.index({ complainant: 1 });
disputeSchema.index({ respondent: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ priority: 1 });
disputeSchema.index({ assignedAdmin: 1 });
disputeSchema.index({ createdAt: -1 });

export const Dispute = mongoose.model<IDispute>('Dispute', disputeSchema);
