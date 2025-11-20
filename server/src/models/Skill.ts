import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
  name: string;
  slug: string;
  category?: string;
  description?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>({
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
  },
  category: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes for searching
skillSchema.index({ name: 'text', description: 'text' });
skillSchema.index({ slug: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ isActive: 1 });

export const Skill = mongoose.model<ISkill>('Skill', skillSchema);
