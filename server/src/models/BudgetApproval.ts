import mongoose, { Schema } from 'mongoose';
import { IBudgetApproval } from '@/types/organization';

const budgetApprovalSchema = new Schema<IBudgetApproval>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
budgetApprovalSchema.index({ requestedBy: 1, status: 1 });
budgetApprovalSchema.index({ status: 1, createdAt: -1 });

const BudgetApproval = mongoose.model<IBudgetApproval>('BudgetApproval', budgetApprovalSchema);

export default BudgetApproval;
