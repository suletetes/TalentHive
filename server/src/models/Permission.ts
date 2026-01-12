import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  resource: string;
  action: string;
  description: string;
  scope?: 'own' | 'any' | 'organization';
  conditions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
  },
  resource: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    index: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  scope: {
    type: String,
    enum: ['own', 'any', 'organization'],
    default: 'own',
  },
  conditions: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Compound index for resource + action lookups
permissionSchema.index({ resource: 1, action: 1 });

// Index for name lookups
permissionSchema.index({ name: 1 });

export const Permission = mongoose.model<IPermission>('Permission', permissionSchema);
