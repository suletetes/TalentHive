import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
  name: string;
  slug: string;
  description?: string;
  category?: mongoose.Types.ObjectId;
  freelancerCount: number;
  projectCount: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  freelancerCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  projectCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
// Note: name and slug already have unique indexes from schema definition
skillSchema.index({ category: 1 });
skillSchema.index({ isActive: 1 });
skillSchema.index({ projectCount: -1 });
skillSchema.index({ freelancerCount: -1 });

// Pre-save middleware to generate slug
skillSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Static method to increment project count
skillSchema.statics.incrementProjectCount = async function(skillName: string) {
  return this.findOneAndUpdate(
    { name: skillName },
    { $inc: { projectCount: 1 } },
    { new: true }
  );
};

// Static method to decrement project count
skillSchema.statics.decrementProjectCount = async function(skillName: string) {
  return this.findOneAndUpdate(
    { name: skillName },
    { $inc: { projectCount: -1 } },
    { new: true }
  );
};

// Static method to increment freelancer count
skillSchema.statics.incrementFreelancerCount = async function(skillName: string) {
  return this.findOneAndUpdate(
    { name: skillName },
    { $inc: { freelancerCount: 1 } },
    { new: true }
  );
};

// Static method to decrement freelancer count
skillSchema.statics.decrementFreelancerCount = async function(skillName: string) {
  return this.findOneAndUpdate(
    { name: skillName },
    { $inc: { freelancerCount: -1 } },
    { new: true }
  );
};

export const Skill = mongoose.model<ISkill>('Skill', skillSchema);
