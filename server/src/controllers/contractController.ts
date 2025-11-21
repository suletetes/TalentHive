// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Contract } from '@/models/Contract';
import { Proposal } from '@/models/Proposal';
import { Project } from '@/models/Project';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { deleteCache } from '@/config/redis';
import crypto from 'crypto';

interface AuthRequest extends Request {
  user?: any;
}

export const createContractValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
];

export const createContract = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return next(new AppError(errorMessages, 400));
  }

  const { proposalId } = req.params;
  const { title, description, startDate, endDate, terms, customMilestones } = req.body;

  // Get the accepted proposal
  const proposal = await Proposal.findById(proposalId)
    .populate('project')
    .populate('freelancer');

  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  if (proposal.status !== 'accepted') {
    return next(new AppError('Only accepted proposals can be converted to contracts', 400));
  }

  const project = proposal.project as any;

  // Check if user is the project owner
  if (project.client.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only create contracts for your own projects', 403));
  }

  // Check if contract already exists for this proposal
  const existingContract = await Contract.findOne({ proposal: proposalId });
  if (existingContract) {
    return next(new AppError('Contract already exists for this proposal', 400));
  }

  // Use custom milestones or proposal milestones
  const milestones = customMilestones || proposal.milestones.map((milestone: any) => ({
    title: milestone.title,
    description: milestone.description,
    amount: milestone.amount,
    dueDate: milestone.dueDate,
    status: 'pending',
  }));

  // Create contract
  const contractData = {
    project: project._id,
    client: project.client,
    freelancer: proposal.freelancer._id,
    proposal: proposalId,
    title,
    description,
    totalAmount: proposal.bidAmount,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    milestones,
    terms: {
      paymentTerms: terms?.paymentTerms || 'Payment will be released upon milestone completion and client approval.',
      cancellationPolicy: terms?.cancellationPolicy || 'Either party may cancel this contract with 7 days written notice.',
      intellectualProperty: terms?.intellectualProperty || 'All work product created under this contract will be owned by the client.',
      confidentiality: terms?.confidentiality || 'Both parties agree to maintain confidentiality of all project information.',
      disputeResolution: terms?.disputeResolution || 'Disputes will be resolved through the platform\'s dispute resolution process.',
      additionalTerms: terms?.additionalTerms,
    },
    status: 'draft',
  };

  const contract = new Contract(contractData);
  await contract.save();

  // Populate contract data for response
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  res.status(201).json({
    status: 'success',
    message: 'Contract created successfully',
    data: {
      contract,
    },
  });
});

export const getContract = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const contract = await Contract.findById(id)
    .populate('client', 'profile')
    .populate('freelancer', 'profile freelancerProfile rating')
    .populate('project', 'title description')
    .populate('proposal', 'coverLetter bidAmount');

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  res.json({
    status: 'success',
    data: {
      contract,
    },
  });
});

export const getMyContracts = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, status, role } = req.query;

  const query: any = {};

  // Filter by user role
  if (role === 'client') {
    query.client = req.user._id;
  } else if (role === 'freelancer') {
    query.freelancer = req.user._id;
  } else {
    // Show all contracts where user is either client or freelancer
    query.$or = [
      { client: req.user._id },
      { freelancer: req.user._id },
    ];
  }

  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [contracts, total] = await Promise.all([
    Contract.find(query)
      .populate('client', 'profile rating')
      .populate('freelancer', 'profile freelancerProfile rating')
      .populate('project', 'title description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .lean(),
    Contract.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      contracts: contracts || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const signContract = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const isParticipant = [contract.client.toString(), contract.freelancer.toString()]
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to sign this contract', 403));
  }

  // Check if user already signed
  const existingSignature = contract.signatures.find(
    (sig: any) => sig.signedBy.toString() === req.user._id.toString()
  );

  if (existingSignature) {
    return next(new AppError('You have already signed this contract', 400));
  }

  // Create signature
  const signatureData = {
    signedBy: req.user._id,
    signedAt: new Date(),
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    signatureHash: crypto.createHash('sha256')
      .update(`${req.user._id}-${Date.now()}-${req.ip}`)
      .digest('hex'),
  };

  contract.signatures.push(signatureData as any);

  // If both parties signed, activate the contract
  if (contract.isFullySigned()) {
    contract.status = 'active';
  }

  await contract.save();

  res.json({
    status: 'success',
    message: 'Contract signed successfully',
    data: {
      contract,
      isFullySigned: contract.isFullySigned(),
    },
  });
});

export const submitMilestone = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, milestoneId } = req.params;
  const { deliverables, freelancerNotes } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  if (!contract.canSubmitMilestone(milestoneId, req.user._id.toString())) {
    return next(new AppError('You cannot submit this milestone', 403));
  }

  const milestone = contract.milestones.id(milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  // Update milestone
  milestone.status = 'submitted';
  milestone.submittedAt = new Date();
  milestone.freelancerNotes = freelancerNotes;

  // Add deliverables
  if (deliverables && deliverables.length > 0) {
    deliverables.forEach((deliverable: any) => {
      milestone.deliverables.push({
        ...deliverable,
        milestone: milestoneId,
        status: 'submitted',
        submittedAt: new Date(),
      });
    });
  }

  await contract.save();

  // Repopulate contract to get updated data
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  res.json({
    status: 'success',
    message: 'Milestone submitted successfully',
    data: {
      contract,
      milestone,
    },
  });
});

export const approveMilestone = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, milestoneId } = req.params;
  const { clientFeedback } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  if (!contract.canApproveMilestone(milestoneId, req.user._id.toString())) {
    return next(new AppError('You cannot approve this milestone', 403));
  }

  const milestone = contract.milestones.id(milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  // Update milestone
  milestone.status = 'approved';
  milestone.approvedAt = new Date();
  milestone.clientFeedback = clientFeedback;

  // Approve all deliverables
  milestone.deliverables.forEach((deliverable: any) => {
    if (deliverable.status === 'submitted') {
      deliverable.status = 'approved';
      deliverable.approvedAt = new Date();
    }
  });

  await contract.save();

  // Repopulate contract to get updated data
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  res.json({
    status: 'success',
    message: 'Milestone approved successfully',
    data: {
      contract,
      milestone,
    },
  });
});

export const rejectMilestone = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, milestoneId } = req.params;
  const { clientFeedback } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  if (!contract.canApproveMilestone(milestoneId, req.user._id.toString())) {
    return next(new AppError('You cannot reject this milestone', 403));
  }

  const milestone = contract.milestones.id(milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  // Update milestone
  milestone.status = 'rejected';
  milestone.rejectedAt = new Date();
  milestone.clientFeedback = clientFeedback;

  // Reject all deliverables
  milestone.deliverables.forEach((deliverable: any) => {
    if (deliverable.status === 'submitted') {
      deliverable.status = 'rejected';
      deliverable.rejectedAt = new Date();
      deliverable.clientFeedback = clientFeedback;
    }
  });

  await contract.save();

  // Repopulate contract to get updated data
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  res.json({
    status: 'success',
    message: 'Milestone rejected',
    data: {
      contract,
      milestone,
    },
  });
});

export const proposeAmendment = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { type, description, changes, reason } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const isParticipant = [contract.client.toString(), contract.freelancer.toString()]
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to propose amendments to this contract', 403));
  }

  if (contract.status !== 'active') {
    return next(new AppError('Amendments can only be proposed for active contracts', 400));
  }

  const amendment = {
    type,
    description,
    proposedBy: req.user._id,
    changes,
    reason,
    status: 'pending',
  };

  contract.amendments.push(amendment as any);
  await contract.save();

  res.json({
    status: 'success',
    message: 'Amendment proposed successfully',
    data: {
      amendment: contract.amendments[contract.amendments.length - 1],
    },
  });
});

export const respondToAmendment = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, amendmentId } = req.params;
  const { status, responseNotes } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  const amendment = contract.amendments.id(amendmentId);
  if (!amendment) {
    return next(new AppError('Amendment not found', 404));
  }

  // Check if user is the other party (not the proposer)
  const otherParty = amendment.proposedBy.toString() === contract.client.toString() 
    ? contract.freelancer.toString() 
    : contract.client.toString();

  if (req.user._id.toString() !== otherParty) {
    return next(new AppError('You are not authorized to respond to this amendment', 403));
  }

  if (amendment.status !== 'pending') {
    return next(new AppError('Amendment has already been responded to', 400));
  }

  // Update amendment
  amendment.status = status;
  amendment.respondedAt = new Date();
  amendment.respondedBy = req.user._id;
  amendment.responseNotes = responseNotes;

  // If accepted, apply the changes
  if (status === 'accepted') {
    // Apply changes based on amendment type
    switch (amendment.type) {
      case 'milestone_change':
        // Update milestones
        if (amendment.changes.milestones) {
          contract.milestones = amendment.changes.milestones;
        }
        break;
      case 'timeline_change':
        // Update timeline
        if (amendment.changes.endDate) {
          contract.endDate = new Date(amendment.changes.endDate);
        }
        break;
      case 'amount_change':
        // Update total amount
        if (amendment.changes.totalAmount) {
          contract.totalAmount = amendment.changes.totalAmount;
        }
        break;
      case 'terms_change':
        // Update terms
        if (amendment.changes.terms) {
          contract.terms = { ...contract.terms, ...amendment.changes.terms };
        }
        break;
    }
  }

  await contract.save();

  res.json({
    status: 'success',
    message: `Amendment ${status} successfully`,
    data: {
      amendment,
    },
  });
});

export const cancelContract = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const isParticipant = [contract.client.toString(), contract.freelancer.toString()]
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to cancel this contract', 403));
  }

  if (!['draft', 'active'].includes(contract.status)) {
    return next(new AppError('Contract cannot be cancelled in current status', 400));
  }

  contract.status = 'cancelled';
  
  // Add cancellation amendment for record keeping
  contract.amendments.push({
    type: 'scope_change',
    description: 'Contract cancellation',
    proposedBy: req.user._id,
    changes: { status: 'cancelled' },
    reason: reason || 'Contract cancelled by user',
    status: 'accepted',
    respondedAt: new Date(),
    respondedBy: req.user._id,
  } as any);

  await contract.save();

  // Clear cache
  await deleteCache('contracts:*');

  res.json({
    status: 'success',
    message: 'Contract cancelled successfully',
  });
});