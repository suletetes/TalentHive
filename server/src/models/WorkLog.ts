import mongoose, { Schema } from 'mongoose';

export interface IWorkLog {
  _id: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  contract: mongoose.Types.ObjectId;
  milestone?: mongoose.Types.ObjectId; // Optional milestone reference
  date: Date;
  startTime: string; // HH:mm format
  endTime?: string; // HH:mm format
  duration: number; // in minutes
  description: string;
  status: 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const workLogSchema = new Schema<IWorkLog>(
  {
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
      ref: 'Contract.milestones',
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
workLogSchema.index({ freelancer: 1, date: -1 });
workLogSchema.index({ contract: 1, date: -1 });

// Calculate duration before saving when endTime is set
workLogSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    this.duration = endMinutes - startMinutes;
    if (this.duration < 0) {
      this.duration += 24 * 60; // Handle overnight work
    }
  }
  next();
});

const WorkLog = mongoose.model<IWorkLog>('WorkLog', workLogSchema);

export default WorkLog;
