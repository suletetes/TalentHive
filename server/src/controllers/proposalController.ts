import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Proposal } from '@/models/Proposal';
import { Project } from '@/models/Project';
import { User } from '@/models/User';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { deleteCache } from '@/config/redis';
import { notificationService } from '@/services/notification.service';

interface AuthRequest extends Request {
  user?: any;
}

export const createProposalValidation = [
  body('coverLetter').trim().isLength({ min: 50, max: 2000 }).withMessage('Cover letter must be between 50 and 2000 characters'),
  body('bidAmount').optional().isFloat({ min: 0 }).withMessage('Bid amount must be a positive number'),
  body('proposedBudget.amount').optional().isFloat({ min: 0 }).withMessage('Proposed budget amount must be a positive number'),
  body('timeline.duration').isInt({ min: 1 }).withMessage('Timeline duration must be a positive integer'),
  body('timeline.unit').isIn(['days', 'weeks', 'months']).withMessage('Timeline unit must be days, weeks, or months'),
];

export const createProposal = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return next(new AppError(errorMessages, 400));
  }

  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (req.user?.role !== 'freelancer') {
    return next(new AppError('Only freelancers can submit proposals', 403));
  }

  const { projectId } = req.params;
  const { coverLetter, bidAmount, proposedBudget, timeline, milestones, attachments } = req.body;

  // Handle both bidAmount and proposedBudget formats
  const finalBidAmount = bidAmount || proposedBudget?.amount;
  
  if (!finalBidAmount) {
    return next(new AppError('Bid amount is required', 400));
  }

  // Check if project exists and is open for proposals
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.status !== 'open') {
    return next(new AppError('Project is not accepting proposals', 400));
  }

  const projectClientId = project.client.toString();
  if (projectClientId === userId.toString()) {
    return next(new AppError('Cannot submit proposal to your own project', 400));
  }

  // Check if freelancer already submitted a proposal
  const existingProposal = await Proposal.findOne({
    project: projectId,
    freelancer: userId,
  });

  if (existingProposal) {
    return next(new AppError('You have already submitted a proposal for this project', 400));
  }

  // ISSUE #4 FIX: Allow applications until project is manually closed
  // Only check deadline if project is not explicitly open
  if (project.status !== 'open') {
    return next(new AppError('Project is not accepting proposals', 400));
  }
  // Removed strict deadline check - allow proposals as long as project is open

  const proposal = new Proposal({
    project: projectId,
    freelancer: userId,
    coverLetter,
    bidAmount: finalBidAmount,
    timeline,
    milestones: milestones || [],
    attachments: attachments || [],
  });

  await proposal.save();

  // Add proposal to project
  await Project.findByIdAndUpdate(projectId, {
    $push: { proposals: proposal._id },
  });

  // Clear cache
  await deleteCache(`proposals:project:${projectId}`);

  // Send notification to client
  try {
    const freelancer = await User.findById(userId);
    if (freelancer?.profile) {
      const freelancerName = `${freelancer.profile.firstName} ${freelancer.profile.lastName}`;
      await notificationService.notifyNewProposal(
        project.client.toString(),
        userId.toString(),
        freelancerName,
        projectId,
        proposal._id.toString()
      );
    }
  } catch (error) {
    console.error('Failed to send proposal notification:', error);
  }

  res.status(201).json({
    status: 'success',
    message: 'Proposal submitted successfully',
    data: {
      proposal,
    },
  });
});

export const getProposalsForProject = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId } = req.params;
  const { sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user is the project owner
  const projectClientId = project.client.toString();
  if (projectClientId !== userId.toString()) {
    return next(new AppError('You can only view proposals for your own projects', 403));
  }

  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const proposals = await Proposal.find({ project: projectId })
    .populate('freelancer', 'profile rating freelancerProfile')
    .sort({ isHighlighted: -1, ...sort });

  res.json({
    status: 'success',
    data: {
      proposals,
      count: proposals.length,
    },
  });
});

export const getMyProposals = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = 'submittedAt',
    sortOrder = 'desc',
  } = req.query;

  if (req.user.role !== 'freelancer') {
    return next(new AppError('Only freelancers can view their proposals', 403));
  }

  const query: any = { freelancer: req.user._id };
  if (status) {
    query.status = status;
  }

  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  try {
    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate('project', 'title description client budget timeline status')
        .populate('freelancer', 'profile rating')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      Proposal.countDocuments(query),
    ]);

    res.json({
      status: 'success',
      data: {
        proposals: proposals || [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return next(new AppError('Failed to fetch proposals', 500));
  }
});

export const getProposalById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const proposal = await Proposal.findById(id)
    .populate('freelancer', 'profile rating freelancerProfile')
    .populate('project', 'title description client budget timeline status')
    .populate({
      path: 'project',
      populate: {
        path: 'client',
        select: 'profile rating clientProfile',
      },
    });

  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  res.json({
    status: 'success',
    data: {
      proposal,
    },
  });
});

export const updateProposal = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { coverLetter, bidAmount, timeline, milestones, attachments } = req.body;

  const proposal = await Proposal.findById(id);
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  // Check if user owns the proposal
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const freelancerId = proposal.freelancer.toString();
  if (freelancerId !== userId.toString()) {
    return next(new AppError('You can only update your own proposals', 403));
  }

  // Can only update submitted proposals
  if (proposal.status !== 'submitted') {
    return next(new AppError('Can only update submitted proposals', 400));
  }

  const updateData: any = {};
  if (coverLetter) updateData.coverLetter = coverLetter;
  if (bidAmount) updateData.bidAmount = bidAmount;
  if (timeline) updateData.timeline = timeline;
  if (milestones) updateData.milestones = milestones;
  if (attachments) updateData.attachments = attachments;

  const updatedProposal = await Proposal.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('freelancer', 'profile rating freelancerProfile');

  // Clear cache
  await deleteCache(`proposals:project:${proposal.project}`);

  res.json({
    status: 'success',
    message: 'Proposal updated successfully',
    data: {
      proposal: updatedProposal,
    },
  });
});

export const withdrawProposal = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const proposal = await Proposal.findById(id);
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  // Check if user owns the proposal
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const freelancerId = proposal.freelancer.toString();
  if (freelancerId !== userId.toString()) {
    return next(new AppError('You can only withdraw your own proposals', 403));
  }

  await proposal.withdraw();

  // Clear cache
  await deleteCache(`proposals:project:${proposal.project}`);

  res.json({
    status: 'success',
    message: 'Proposal withdrawn successfully',
  });
});

export const acceptProposal = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { feedback } = req.body;

  const proposal = await Proposal.findById(id).populate('project').populate('freelancer');
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  const project = proposal.project as any;

  // Check if user owns the project
  if (project.client.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only accept proposals for your own projects', 403));
  }

  // Check if project is still open
  if (project.status !== 'open') {
    return next(new AppError('Project is no longer accepting proposals', 400));
  }

  // ISSUE #7 FIX: Check if contract already exists for this project
  const { Contract } = await import('@/models/Contract');
  const existingContract = await Contract.findOne({ project: project._id });
  if (existingContract) {
    return next(new AppError('A contract has already been created for this project. Cannot accept another proposal.', 400));
  }

  const updatedProposal = await proposal.accept(feedback);

  // Update project status and selected freelancer
  await Project.findByIdAndUpdate(project._id, {
    status: 'in_progress',
    selectedFreelancer: proposal.freelancer,
    startDate: new Date(),
  });

  // Reject all other submitted proposals for this project
  await Proposal.updateMany(
    {
      project: project._id,
      _id: { $ne: proposal._id },
      status: 'submitted',
    },
    {
      status: 'rejected',
      respondedAt: new Date(),
      clientFeedback: 'Another proposal was selected for this project.',
    }
  );

  // AUTO-CREATE CONTRACT when proposal is accepted
  // (Contract already imported above for existence check)
  
  // Calculate end date based on proposal timeline
  const startDate = new Date();
  let endDate = new Date();
  const duration = proposal.timeline?.duration || 30;
  const unit = proposal.timeline?.unit || 'days';
  
  if (unit === 'days') {
    endDate.setDate(endDate.getDate() + duration);
  } else if (unit === 'weeks') {
    endDate.setDate(endDate.getDate() + (duration * 7));
  } else if (unit === 'months') {
    endDate.setMonth(endDate.getMonth() + duration);
  }

  // Create milestones from proposal or default single milestone
  const milestones = proposal.milestones && proposal.milestones.length > 0
    ? proposal.milestones.map((m: any) => ({
        title: m.title,
        description: m.description || '',
        amount: m.amount,
        dueDate: m.dueDate || endDate,
        status: 'pending',
      }))
    : [{
        title: 'Project Completion',
        description: 'Complete the project as described',
        amount: proposal.bidAmount,
        dueDate: endDate,
        status: 'pending',
      }];

  const contract = new Contract({
    project: project._id,
    client: project.client,
    freelancer: proposal.freelancer,
    proposal: proposal._id,
    title: project.title,
    description: project.description,
    totalAmount: proposal.bidAmount,
    budget: {
      amount: proposal.bidAmount,
      type: project.budget?.type || 'fixed',
    },
    startDate,
    endDate,
    sourceType: 'proposal',
    milestones,
    terms: {
      paymentTerms: 'Payment will be released upon milestone completion and client approval.',
      cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
      intellectualProperty: 'All work product created under this contract will be owned by the client.',
      confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
      disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
    },
    status: 'draft',
  });

  await contract.save();

  // Clear cache
  await deleteCache(`proposals:project:${project._id}`);
  await deleteCache('projects:*');
  await deleteCache('contracts:*');

  // Send notification to freelancer
  try {
    const client = await User.findById(req.user._id);
    const clientName = `${client?.profile.firstName} ${client?.profile.lastName}`;
    // ISSUE #14 FIX: Extract ID from freelancer (might be populated object)
    const freelancerId = typeof proposal.freelancer === 'object' && (proposal.freelancer as any)._id
      ? (proposal.freelancer as any)._id.toString()
      : proposal.freelancer.toString();
    await notificationService.notifyProposalAccepted(
      freelancerId,
      clientName,
      project._id.toString(),
      proposal._id.toString()
    );
  } catch (error) {
    console.error('Failed to send proposal accepted notification:', error);
  }

  res.json({
    status: 'success',
    message: 'Proposal accepted and contract created successfully',
    data: {
      proposal: updatedProposal,
      contract,
    },
  });
});

export const rejectProposal = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { feedback } = req.body;

  const proposal = await Proposal.findById(id).populate('project');
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  const project = proposal.project as any;

  // Check if user owns the project
  if (project.client.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only reject proposals for your own projects', 403));
  }

  const updatedProposal = await proposal.reject(feedback);

  // Clear cache
  await deleteCache(`proposals:project:${project._id}`);

  // Send notification to freelancer
  try {
    const client = await User.findById(req.user._id);
    const clientName = `${client?.profile.firstName} ${client?.profile.lastName}`;
    // ISSUE #14 FIX: Extract ID from freelancer (might be populated object)
    const freelancerId = typeof proposal.freelancer === 'object' && (proposal.freelancer as any)._id
      ? (proposal.freelancer as any)._id.toString()
      : proposal.freelancer.toString();
    await notificationService.notifyProposalRejected(
      freelancerId,
      clientName,
      project._id.toString(),
      proposal._id.toString()
    );
  } catch (error) {
    console.error('Failed to send proposal rejected notification:', error);
  }

  res.json({
    status: 'success',
    message: 'Proposal rejected successfully',
    data: {
      proposal: updatedProposal,
    },
  });
});

export const highlightProposal = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const proposal = await Proposal.findById(id);
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  // Check if user owns the proposal
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const freelancerId = proposal.freelancer.toString();
  if (freelancerId !== userId.toString()) {
    return next(new AppError('You can only highlight your own proposals', 403));
  }

  // Can only highlight submitted proposals
  if (proposal.status !== 'submitted') {
    return next(new AppError('Can only highlight submitted proposals', 400));
  }

  proposal.isHighlighted = !proposal.isHighlighted;
  await proposal.save();

  // Clear cache
  await deleteCache(`proposals:project:${proposal.project}`);

  res.json({
    status: 'success',
    message: `Proposal ${proposal.isHighlighted ? 'highlighted' : 'unhighlighted'} successfully`,
    data: {
      proposal,
    },
  });
});

export const getProposalStats = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let stats: any = {};

  if (userRole === 'freelancer') {
    const [total, submitted, accepted, rejected] = await Promise.all([
      Proposal.countDocuments({ freelancer: userId }),
      Proposal.countDocuments({ freelancer: userId, status: 'submitted' }),
      Proposal.countDocuments({ freelancer: userId, status: 'accepted' }),
      Proposal.countDocuments({ freelancer: userId, status: 'rejected' }),
    ]);

    stats = {
      total,
      submitted,
      accepted,
      rejected,
      successRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    };
  } else if (userRole === 'client') {
    // Get proposals for client's projects
    const projects = await Project.find({ client: userId }).select('_id');
    const projectIds = projects.map(p => p._id);

    const [total, submitted, accepted, rejected] = await Promise.all([
      Proposal.countDocuments({ project: { $in: projectIds } }),
      Proposal.countDocuments({ project: { $in: projectIds }, status: 'submitted' }),
      Proposal.countDocuments({ project: { $in: projectIds }, status: 'accepted' }),
      Proposal.countDocuments({ project: { $in: projectIds }, status: 'rejected' }),
    ]);

    stats = {
      total,
      submitted,
      accepted,
      rejected,
    };
  }

  res.json({
    status: 'success',
    data: {
      stats,
    },
  });
});

export const deleteProposal = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;

  const proposal = await Proposal.findById(id);
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  // Check if user owns the proposal
  if (proposal.freelancer.toString() !== userId?.toString()) {
    return next(new AppError('You can only delete your own proposals', 403));
  }

  // Can only delete submitted or withdrawn proposals
  if (!['submitted', 'withdrawn'].includes(proposal.status)) {
    return next(new AppError('Cannot delete accepted or rejected proposals', 400));
  }

  const projectId = proposal.project;

  // Remove proposal from project
  await Project.findByIdAndUpdate(projectId, {
    $pull: { proposals: proposal._id },
  });

  // Delete the proposal
  await Proposal.findByIdAndDelete(id);

  // Clear cache
  await deleteCache(`proposals:project:${projectId}`);

  res.json({
    status: 'success',
    message: 'Proposal deleted successfully',
  });
});
