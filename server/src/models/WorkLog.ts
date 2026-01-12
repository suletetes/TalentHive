import mongoose, { Schema } from 'mongoose';

export interface IWorkLog {
  _id: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  contract: mongoose.Types.ObjectId;
  milestone?: mongoose.Types.ObjectId;
  startDate: Date;
  startTime: string; // HH:mm format
  endDate?: Date;
  endTime?: string; // HH:mm format
  duration: number; // in minutes (calculated from start to end)
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
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endDate: {
      type: Date,
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
      maxlength: 1000,
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
workLogSchema.index({ freelancer: 1, startDate: -1 });
workLogSchema.index({ contract: 1, startDate: -1 });

// Calculate duration before saving when completed
workLogSchema.pre('save', function (next) {
  if (this.status === 'completed' && this.startDate && this.endDate && this.startTime && this.endTime) {
    const [startH, startM] = this.startTime.split(':').map(Number);
    const [endH, endM] = this.endTime.split(':').map(Number);
    
    const startDateTime = new Date(this.startDate);
    startDateTime.setHours(startH, startM, 0, 0);
    
    const endDateTime = new Date(this.endDate);
    endDateTime.setHours(endH, endM, 0, 0);
    
    // Duration in minutes
    this.duration = Math.max(0, Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000));
  }
  next();
});

const WorkLog = mongoose.model<IWorkLog>('WorkLog', workLogSchema);

export default WorkLog;
