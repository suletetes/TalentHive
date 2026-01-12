import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  description: string;
  logo?: string;
  owner: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'member';
    permissions: string[];
    joinedAt: Date;
  }>;
  budget: {
    total: number;
    spent: number;
    remaining: number;
    currency: string;
  };
  settings: {
    requireApproval: boolean;
    maxProjectBudget: number;
    allowedCategories: mongoose.Types.ObjectId[];
  };
  projects: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member'],
          default: 'member',
        },
        permissions: [
          {
            type: String,
          },
        ],
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    budget: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      spent: {
        type: Number,
        default: 0,
        min: 0,
      },
      remaining: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
      },
    },
    settings: {
      requireApproval: {
        type: Boolean,
        default: true,
      },
      maxProjectBudget: {
        type: Number,
        default: 0,
      },
      allowedCategories: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Category',
        },
      ],
    },
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
organizationSchema.index({ owner: 1 });
organizationSchema.index({ 'members.user': 1 });
organizationSchema.index({ name: 'text', description: 'text' });

// Update remaining budget before save
organizationSchema.pre('save', function (next) {
  if (this.isModified('budget.total') || this.isModified('budget.spent')) {
    this.budget.remaining = this.budget.total - this.budget.spent;
  }
  next();
});

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
