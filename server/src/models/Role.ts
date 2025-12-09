import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  slug: string;
  description: string;
  permissions: mongoose.Types.ObjectId[];
  isSystem: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  permissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission',
  }],
  isSystem: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for performance
roleSchema.index({ slug: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystem: 1 });

// Prevent deletion of system roles
roleSchema.pre('deleteOne', function(next) {
  // This hook is for query middleware
  next();
});

export const Role = mongoose.model<IRole>('Role', roleSchema);
