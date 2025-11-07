import mongoose, { Schema } from 'mongoose';
import { IWorkSession } from '@/types/timeTracking';

const workSessionSchema = new Schema<IWorkSession>(
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
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
    },
    totalDuration: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    timeEntries: [{
      type: Schema.Types.ObjectId,
      ref: 'TimeEntry',
    }],
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
workSessionSchema.index({ freelancer: 1, status: 1, startTime: -1 });
workSessionSchema.index({ project: 1, status: 1 });

// Virtual for duration in hours
workSessionSchema.virtual('durationHours').get(function() {
  return this.totalDuration / 3600;
});

const WorkSession = mongoose.model<IWorkSession>('WorkSession', workSessionSchema);

export default WorkSession;
