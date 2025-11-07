import mongoose, { Schema } from 'mongoose';
import { IProjectTemplate } from '@/types/servicePackage';

const milestoneSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    durationDays: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const recurringScheduleSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
      required: true,
    },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    autoPost: { type: Boolean, default: false },
  },
  { _id: false }
);

const projectTemplateSchema = new Schema<IProjectTemplate>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    budget: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    skills: [String],
    requirements: [String],
    deliverables: [String],
    milestones: [milestoneSchema],
    preferredVendors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringSchedule: recurringScheduleSchema,
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectTemplateSchema.index({ client: 1 });
projectTemplateSchema.index({ organization: 1 });
projectTemplateSchema.index({ category: 1 });

const ProjectTemplate = mongoose.model<IProjectTemplate>('ProjectTemplate', projectTemplateSchema);

export default ProjectTemplate;
