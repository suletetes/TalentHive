import mongoose, { Schema } from 'mongoose';
import { ITimeEntry } from '@/types/timeTracking';

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    contract: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      index: true,
    },
    milestone: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    activityLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    screenshots: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ['active', 'paused', 'stopped', 'submitted', 'approved', 'rejected'],
      default: 'active',
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    billableAmount: {
      type: Number,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
timeEntrySchema.index({ freelancer: 1, startTime: -1 });
timeEntrySchema.index({ project: 1, status: 1 });
timeEntrySchema.index({ contract: 1, status: 1 });
timeEntrySchema.index({ status: 1, submittedAt: -1 });

// Calculate billable amount before saving
timeEntrySchema.pre('save', function(next) {
  if (this.duration && this.hourlyRate) {
    const hours = this.duration / 3600;
    this.billableAmount = hours * this.hourlyRate;
  }
  next();
});

// Virtual for duration in hours
timeEntrySchema.virtual('durationHours').get(function() {
  return this.duration / 3600;
});

// Virtual for formatted duration
timeEntrySchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
});

const TimeEntry = mongoose.model<ITimeEntry>('TimeEntry', timeEntrySchema);

export default TimeEntry;
