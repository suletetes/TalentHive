import mongoose, { Schema } from 'mongoose';
import { IProject, IProjectModel } from '@/types/project';

const budgetSchema = new Schema({
  type: {
    type: String,
    enum: ['fixed', 'hourly'],
    required: true,
  },
  min: {
    type: Number,
    required: true,
    min: 0,
  },
  max: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const timelineSchema = new Schema({
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    required: true,
  },
}, { _id: false });

const projectSchema = new Schema<IProject>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  skills: [{
    type: String,
    trim: true,
  }],
  budget: {
    type: budgetSchema,
    required: true,
  },
  timeline: {
    type: timelineSchema,
    required: true,
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
  },
  visibility: {
    type: String,
    enum: ['public', 'invite_only'],
    default: 'public',
  },
  proposals: [{
    type: Schema.Types.ObjectId,
    ref: 'Proposal',
  }],
  selectedFreelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [String],
  requirements: [String],
  deliverables: [String],
  applicationDeadline: Date,
  startDate: Date,
  endDate: Date,
  viewCount: {
    type: Number,
    default: 0,
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  // Draft functionality fields
  isDraft: {
    type: Boolean,
    default: false,
  },
  draftSavedAt: Date,
  publishedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
projectSchema.index({ client: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ skills: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ budget: 1 });
projectSchema.index({ visibility: 1, status: 1 });
projectSchema.index({ isFeatured: 1, createdAt: -1 });
projectSchema.index({ isDraft: 1 });
projectSchema.index({ isUrgent: 1, createdAt: -1 });

// Text search index
projectSchema.index({
  title: 'text',
  description: 'text',
  skills: 'text',
  tags: 'text',
});

// Virtual for proposal count
projectSchema.virtual('proposalCount').get(function() {
  return this.proposals.length;
});

// Virtual for budget range display
projectSchema.virtual('budgetDisplay').get(function() {
  const { type, min, max } = this.budget;
  if (type === 'fixed') {
    return min === max ? `$${min}` : `$${min} - $${max}`;
  } else {
    return min === max ? `$${min}/hr` : `$${min} - $${max}/hr`;
  }
});

// Virtual for timeline display
projectSchema.virtual('timelineDisplay').get(function() {
  const { duration, unit } = this.timeline;
  return `${duration} ${unit}`;
});

// Method to increment view count
projectSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to check if project is expired
projectSchema.methods.isExpired = function() {
  if (!this.applicationDeadline) return false;
  return new Date() > this.applicationDeadline;
};

// Static method to find active projects
projectSchema.statics.findActive = function() {
  return this.find({
    status: 'open',
    visibility: 'public',
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gt: new Date() } },
    ],
  });
};

// Static method to search projects
projectSchema.statics.searchProjects = function(query: string) {
  return this.find({
    $text: { $search: query },
    status: 'open',
    visibility: 'public',
  }).sort({ score: { $meta: 'textScore' } });
};

// Pre-save middleware to sync draft status
projectSchema.pre('save', function(next) {
  // Sync isDraft with status
  if (this.status === 'draft') {
    this.isDraft = true;
    this.draftSavedAt = new Date();
  } else {
    this.isDraft = false;
    if (this.isModified('status') && this.status === 'open' && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }
  next();
});

// Pre-save middleware to validate budget
projectSchema.pre('save', function(next) {
  if (this.budget.min > this.budget.max) {
    next(new Error('Minimum budget cannot be greater than maximum budget'));
  } else {
    next();
  }
});

// Pre-save middleware to set end date based on timeline
projectSchema.pre('save', function(next) {
  if (this.startDate && !this.endDate) {
    const { duration, unit } = this.timeline;
    const startDate = new Date(this.startDate);
    
    switch (unit) {
      case 'days':
        this.endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
        break;
      case 'weeks':
        this.endDate = new Date(startDate.getTime() + duration * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'months':
        this.endDate = new Date(startDate.getFullYear(), startDate.getMonth() + duration, startDate.getDate());
        break;
    }
  }
  next();
});

export const Project = mongoose.model<IProject>('Project', projectSchema) as mongoose.Model<IProject> & IProjectModel;