import mongoose, { Schema } from 'mongoose';
import { IContract, IMilestone, IDeliverable, IContractTerms, IAmendment, ISignature } from '@/types/contract';

const signatureSchema = new Schema<ISignature>({
  signedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  signedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  signatureHash: {
    type: String,
    required: true,
  },
});

const amendmentSchema = new Schema<IAmendment>({
  type: {
    type: String,
    enum: ['milestone_change', 'timeline_change', 'amount_change', 'scope_change', 'terms_change'],
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  proposedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  proposedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  changes: {
    type: Schema.Types.Mixed,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500,
  },
  respondedAt: Date,
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  responseNotes: {
    type: String,
    maxlength: 500,
  },
});

const contractTermsSchema = new Schema<IContractTerms>({
  paymentTerms: {
    type: String,
    required: true,
    default: 'Payment will be released upon milestone completion and client approval.',
  },
  cancellationPolicy: {
    type: String,
    required: true,
    default: 'Either party may cancel this contract with 7 days written notice.',
  },
  intellectualProperty: {
    type: String,
    required: true,
    default: 'All work product created under this contract will be owned by the client.',
  },
  confidentiality: {
    type: String,
    required: true,
    default: 'Both parties agree to maintain confidentiality of all project information.',
  },
  disputeResolution: {
    type: String,
    required: true,
    default: 'Disputes will be resolved through the platform\'s dispute resolution process.',
  },
  additionalTerms: String,
});

const deliverableSchema = new Schema<IDeliverable>({
  milestone: {
    type: Schema.Types.ObjectId,
    required: true,
  },
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
  type: {
    type: String,
    enum: ['file', 'link', 'text', 'code'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'rejected'],
    default: 'pending',
  },
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  clientFeedback: {
    type: String,
    maxlength: 1000,
  },
  metadata: {
    fileSize: Number,
    fileType: String,
    originalName: String,
  },
}, {
  timestamps: true,
});

const milestoneSchema = new Schema<IMilestone>({
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
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },
  deliverables: [deliverableSchema],
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  paidAt: Date,
  clientFeedback: {
    type: String,
    maxlength: 1000,
  },
  freelancerNotes: {
    type: String,
    maxlength: 1000,
  },
});

const contractSchema = new Schema<IContract>({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
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
  proposal: {
    type: Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
  },
  sourceType: {
    type: String,
    enum: ['proposal', 'hire_now', 'service'],
    default: 'proposal',
  },
  hireNowRequest: {
    type: Schema.Types.ObjectId,
    ref: 'HireNowRequest',
  },
  servicePackage: {
    type: Schema.Types.ObjectId,
    ref: 'ServicePackage',
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled', 'disputed'],
    default: 'draft',
  },
  milestones: [milestoneSchema],
  terms: {
    type: contractTermsSchema,
    required: true,
  },
  deliverables: [deliverableSchema],
  amendments: [amendmentSchema],
  signatures: [signatureSchema],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
contractSchema.index({ project: 1 });
contractSchema.index({ client: 1 });
contractSchema.index({ freelancer: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ startDate: 1 });
contractSchema.index({ endDate: 1 });
contractSchema.index({ 'milestones.status': 1 });
contractSchema.index({ 'milestones.dueDate': 1 });

// Virtual for progress calculation
contractSchema.virtual('progress').get(function () {
  if (!this.milestones || !Array.isArray(this.milestones) || this.milestones.length === 0) return 0;

  const completedMilestones = this.milestones.filter(
    (milestone: any) => milestone.status === 'approved' || milestone.status === 'paid'
  ).length;

  return Math.round((completedMilestones / this.milestones.length) * 100);
});

// Virtual for total paid amount
contractSchema.virtual('totalPaid').get(function() {
  if (!this.milestones || !Array.isArray(this.milestones) || this.milestones.length === 0) {
    return 0;
  }
  return this.milestones
    .filter((milestone: any) => milestone && (milestone.status === 'paid' || milestone.status === 'completed'))
    .reduce((total: number, milestone: any) => total + (milestone.amount || 0), 0);
});

// Virtual for remaining amount
contractSchema.virtual('remainingAmount').get(function() {
  if (!this.totalAmount) return 0;
  return Math.max(0, this.totalAmount - (this.totalPaid || 0));
});

// Virtual for overdue milestones
contractSchema.virtual('overdueMilestones').get(function() {
  if (!this.milestones || !Array.isArray(this.milestones)) return [];
  const now = new Date();
  return this.milestones.filter((milestone: any) => milestone && 
    milestone.dueDate < now && 
    !['approved', 'paid'].includes(milestone.status)
  );
});

// Virtual for next milestone
contractSchema.virtual('nextMilestone').get(function () {
  if (!this.milestones || !Array.isArray(this.milestones)) return null;
  return this.milestones
    .filter((milestone: any) => milestone && ['pending', 'in_progress'].includes(milestone.status))
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
});

// Method to check if contract is fully signed
contractSchema.methods.isFullySigned = function() {
  const requiredSignatures = [this.client.toString(), this.freelancer.toString()];
  const existingSignatures = this.signatures.map((sig: any) => sig.signedBy.toString());
  
  return requiredSignatures.every(required => existingSignatures.includes(required));
};

// Method to check if user can modify contract
contractSchema.methods.canBeModified = function(userId: string) {
  if (this.status !== 'draft') return false;
  return [this.client.toString(), this.freelancer.toString()].includes(userId);
};

// Method to check if milestone can be submitted
contractSchema.methods.canSubmitMilestone = function (milestoneId: string, userId: string) {
  if (this.freelancer.toString() !== userId) return false;
  if (this.status !== 'active') return false;
  if (!this.milestones || !this.milestones.id) return false;

  const milestone = this.milestones.id(milestoneId);
  return milestone && ['pending', 'in_progress', 'rejected'].includes(milestone.status);
};

// Method to check if milestone can be approved
contractSchema.methods.canApproveMilestone = function (milestoneId: string, userId: string) {
  if (this.client.toString() !== userId) return false;
  if (this.status !== 'active') return false;
  if (!this.milestones || !this.milestones.id) return false;

  const milestone = this.milestones.id(milestoneId);
  return milestone && milestone.status === 'submitted';
};

// Pre-save middleware to validate contract dates
contractSchema.pre('save', function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }

  // Validate milestone amounts equal total amount (only if milestones exist)
  if (this.milestones && Array.isArray(this.milestones) && this.milestones.length > 0) {
    const totalMilestoneAmount = this.milestones.reduce(
      (total: number, milestone: any) => total + (milestone?.amount || 0),
      0
    );

    if (Math.abs(totalMilestoneAmount - this.totalAmount) > 0.01) {
      return next(new Error('Total milestone amount must equal contract total amount'));
    }
  }

  next();
});

// Pre-save middleware to update contract status based on milestones
contractSchema.pre('save', function (next) {
  if (
    this.status === 'active' &&
    this.milestones &&
    Array.isArray(this.milestones) &&
    this.milestones.length > 0
  ) {
    const allMilestonesCompleted = this.milestones.every(
      (milestone: any) => milestone && milestone.status === 'paid'
    );

    if (allMilestonesCompleted) {
      this.status = 'completed';
    }
  }

  next();
});

export const Contract = mongoose.model<IContract>('Contract', contractSchema);