import mongoose, { Schema, Document } from 'mongoose';

interface IMilestone {
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
}

export interface IHireNowRequest extends Document {
  client: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  projectTitle: string;
  projectDescription: string;
  budget: number;
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  milestones: IMilestone[];
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: Date;
  respondedAt?: Date;
  responseMessage?: string;
  
  // Instance methods
  accept(responseMessage?: string): void;
  reject(responseMessage?: string): void;
}

export interface IHireNowRequestModel extends mongoose.Model<IHireNowRequest> {
  findByClient(clientId: string): Promise<IHireNowRequest[]>;
  findByFreelancer(freelancerId: string): Promise<IHireNowRequest[]>;
}

const milestoneSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: true,
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

const hireNowRequestSchema = new Schema<IHireNowRequest>({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectTitle: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Project title cannot exceed 200 characters'],
  },
  projectDescription: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [5000, 'Project description cannot exceed 5000 characters'],
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget must be positive'],
  },
  timeline: {
    type: timelineSchema,
    required: true,
  },
  milestones: [milestoneSchema],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  message: {
    type: String,
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  respondedAt: {
    type: Date,
  },
  responseMessage: {
    type: String,
    trim: true,
    maxlength: [1000, 'Response message cannot exceed 1000 characters'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
hireNowRequestSchema.index({ client: 1 });
hireNowRequestSchema.index({ freelancer: 1 });
hireNowRequestSchema.index({ status: 1 });
hireNowRequestSchema.index({ createdAt: -1 });

// Virtual for total milestone amount
hireNowRequestSchema.virtual('totalMilestoneAmount').get(function() {
  return this.milestones.reduce((total, milestone) => total + milestone.amount, 0);
});

// Method to accept request
hireNowRequestSchema.methods.accept = function(responseMessage?: string) {
  if (this.status !== 'pending') {
    throw new Error('Can only accept pending requests');
  }
  this.status = 'accepted';
  this.respondedAt = new Date();
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
  return this.save();
};

// Method to reject request
hireNowRequestSchema.methods.reject = function(responseMessage?: string) {
  if (this.status !== 'pending') {
    throw new Error('Can only reject pending requests');
  }
  this.status = 'rejected';
  this.respondedAt = new Date();
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
  return this.save();
};

// Static method to find requests by client
hireNowRequestSchema.statics.findByClient = function(clientId: string) {
  return this.find({ client: clientId })
    .populate('freelancer', 'profile rating freelancerProfile')
    .sort({ createdAt: -1 });
};

// Static method to find requests by freelancer
hireNowRequestSchema.statics.findByFreelancer = function(freelancerId: string) {
  return this.find({ freelancer: freelancerId })
    .populate('client', 'profile rating clientProfile')
    .sort({ createdAt: -1 });
};

export const HireNowRequest = mongoose.model<IHireNowRequest, IHireNowRequestModel>('HireNowRequest', hireNowRequestSchema);
