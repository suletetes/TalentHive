import mongoose, { Schema, Document } from 'mongoose';

export interface IStepCompleted {
  stepNumber: number;
  stepName: string;
  completedAt: Date;
  timeSpent: number; // in seconds
}

export interface IOnboardingAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'freelancer' | 'client';
  startedAt: Date;
  completedAt?: Date;
  skippedAt?: Date;
  currentStep: number;
  totalSteps: number;
  stepsCompleted: IStepCompleted[];
  dropOffStep?: number;
  completionRate: number; // percentage
}

const stepCompletedSchema = new Schema<IStepCompleted>({
  stepNumber: { type: Number, required: true },
  stepName: { type: String, required: true },
  completedAt: { type: Date, required: true, default: Date.now },
  timeSpent: { type: Number, required: true, default: 0, min: 0 }, // seconds
}, { _id: false });

const onboardingAnalyticsSchema = new Schema<IOnboardingAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['admin', 'freelancer', 'client'],
    required: true,
    index: true,
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  completedAt: Date,
  skippedAt: Date,
  currentStep: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalSteps: {
    type: Number,
    required: true,
    default: 5,
    min: 1,
  },
  stepsCompleted: [stepCompletedSchema],
  dropOffStep: {
    type: Number,
    min: 0,
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

// Indexes for analytics queries
onboardingAnalyticsSchema.index({ role: 1, completedAt: 1 });
onboardingAnalyticsSchema.index({ role: 1, skippedAt: 1 });
onboardingAnalyticsSchema.index({ completionRate: 1 });
onboardingAnalyticsSchema.index({ dropOffStep: 1 });

// Calculate completion rate before saving
onboardingAnalyticsSchema.pre('save', function(next) {
  if (this.totalSteps > 0) {
    this.completionRate = (this.stepsCompleted.length / this.totalSteps) * 100;
  }
  next();
});

export const OnboardingAnalytics = mongoose.model<IOnboardingAnalytics>(
  'OnboardingAnalytics',
  onboardingAnalyticsSchema
);
