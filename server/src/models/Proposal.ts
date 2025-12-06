import mongoose, { Schema } from 'mongoose';
import { IProposal } from '@/types/proposal';

const milestoneSchema = new Schema({
  title: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: false,
    maxlength: 1000,
  },
  amount: {
    type: Number,
    required: false,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: false,
  },
  deliverables: [String],
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

const proposalSchema = new Schema<IProposal>({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coverLetter: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 2000,
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  timeline: {
    type: timelineSchema,
    required: true,
  },
  attachments: [String],
  milestones: [milestoneSchema],
  status: {
    type: String,
    enum: ['submitted', 'accepted', 'rejected', 'withdrawn'],
    default: 'submitted',
  },
  clientFeedback: {
    type: String,
    maxlength: 1000,
  },
  isHighlighted: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
proposalSchema.index({ project: 1 });
proposalSchema.index({ freelancer: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ submittedAt: -1 });
proposalSchema.index({ project: 1, freelancer: 1 }, { unique: true }); // Prevent duplicate proposals

// Virtual for timeline display
proposalSchema.virtual('timelineDisplay').get(function() {
  if (!this.timeline) return '';
  const { duration, unit } = this.timeline;
  return `${duration} ${unit}`;
});

// Virtual for total milestone amount
proposalSchema.virtual('totalMilestoneAmount').get(function() {
  if (!this.milestones || !Array.isArray(this.milestones)) return 0;
  return this.milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
});

// Method to check if proposal is expired
proposalSchema.methods.isExpired = function() {
  // Check if project has application deadline and if it's passed
  return false; // Will be implemented when we have project reference
};

// Method to check if proposal can be modified
proposalSchema.methods.canBeModified = function() {
  return ['submitted'].includes(this.status);
};

// Method to check if proposal can be withdrawn
proposalSchema.methods.canBeWithdrawn = function() {
  return this.status === 'submitted';
};

// Method to withdraw proposal
proposalSchema.methods.withdraw = function() {
  if (this.status !== 'submitted') {
    throw new Error('Can only withdraw submitted proposals');
  }
  this.status = 'withdrawn';
  return this.save();
};

// Method to accept proposal
proposalSchema.methods.accept = function(feedback?: string) {
  if (this.status !== 'submitted') {
    throw new Error('Can only accept submitted proposals');
  }
  this.status = 'accepted';
  this.respondedAt = new Date();
  if (feedback) {
    this.clientFeedback = feedback;
  }
  return this.save();
};

// Method to reject proposal
proposalSchema.methods.reject = function(feedback?: string) {
  if (this.status !== 'submitted') {
    throw new Error('Can only reject submitted proposals');
  }
  this.status = 'rejected';
  this.respondedAt = new Date();
  if (feedback) {
    this.clientFeedback = feedback;
  }
  return this.save();
};

// Static method to find proposals for a project
proposalSchema.statics.findByProject = function(projectId: string) {
  return this.find({ project: projectId })
    .populate('freelancer', 'profile rating freelancerProfile')
    .sort({ isHighlighted: -1, submittedAt: -1 });
};

// Static method to find proposals by freelancer
proposalSchema.statics.findByFreelancer = function(freelancerId: string) {
  return this.find({ freelancer: freelancerId })
    .populate('project', 'title description client budget timeline status')
    .populate({
      path: 'project',
      populate: {
        path: 'client',
        select: 'profile rating clientProfile',
      },
    })
    .sort({ submittedAt: -1 });
};

// Pre-save middleware to validate bid amount against project budget
proposalSchema.pre('save', async function(next) {
  // Set submittedAt when status is submitted
  if (this.isNew && this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  
  // Set respondedAt when status changes to accepted/rejected
  if (this.isModified('status')) {
    if (['accepted', 'rejected'].includes(this.status) && !this.respondedAt) {
      this.respondedAt = new Date();
    }
  }
  
  if (this.isNew || this.isModified('bidAmount')) {
    try {
      const Project = mongoose.model('Project');
      const project = await Project.findById(this.project);
      
      if (project) {
        const { budget } = project;
        if (budget.type === 'fixed') {
          if (this.bidAmount < budget.min || this.bidAmount > budget.max * 1.5) {
            // Allow up to 50% over max budget for flexibility
            next(new Error(`Bid amount should be between $${budget.min} and $${budget.max * 1.5}`));
            return;
          }
        }
      }
    } catch (error) {
      // Continue if project not found or other errors
    }
  }
  next();
});

// Instance method to check if proposal can be modified
proposalSchema.methods.canBeModified = function(): boolean {
  // Proposals can be modified if they are in draft or submitted status
  // Once accepted or rejected, they cannot be modified
  return ['draft', 'submitted'].includes(this.status);
};

export const Proposal = mongoose.model<IProposal>('Proposal', proposalSchema);