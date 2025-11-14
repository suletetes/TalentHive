// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Proposal } from '@/models/Proposal';
import { Project } from '@/models/Project';
import { User } from '@/models/User';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { deleteCache } from '@/config/redis';

interface AuthRequest extends Request {
  user?: any;
}

export const createProposalValidation = [
  body('coverLetter').trim().isLength({ min: 50, max: 2000 }).withMessage('Cover letter must be between 50 and 2000 characters'),
  body('bidAmount').isFloat({ min: 0 }).withMessage('Bid amount must be a positive number'),
  body('timeline.duration').isInt({ min: 1 }).withMessage('Timeline duration must be a positive integer'),
  body('timeline.unit').isIn(['days', 'weeks', 'months']).withMessage('Timeline unit must be days, weeks, or months'),
];

export const createProposal = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  if (req.user.role !== 'freelancer') {
    return next(new AppError('Only freelancers can submit proposals', 403));
  }

  const { projectId } = req.params;
  const { coverLetter, bidAmount, timeline, milestones, attachments } = req.body;

  // Check if project exists and is open for proposals
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.status !== 'open') {
    return next(new AppError('Project is not accepting proposals', 400));
  }

  if (project.client.toString() === req.user._id.toString()) {
    return next(new AppError('Cannot submit proposal to your own project', 400));
  }

  // Check if freelancer already submitted a proposal
  const existingProposal = await Proposal.findOne({
    project: projectId,
    freelancer: req.user._id,
  });

  if (existingProposal) {
    return next(new AppError('You have already submitted a proposal for this project', 400));
  }

  // Check application deadline
  if (project.applicationDeadline && new Date() > project.applicationDeadline) {
    return next(new AppError('Application deadline has passed', 400));
  }

  const proposal = new Proposal({
    project: projectId,
    freelancer: req.user._id,
    coverLetter,
    bidAmount,
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

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user is the project owner
  if (project.client.toString() !== req.user._id.toString()) {
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

  const [proposals, total] = await Promise.all([
    Proposal.find(query)
      .populate('project', 'title description client budget timeline status')
      .populate('freelancer', 'profile rating')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string)),
    Proposal.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      proposals,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
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
  if (proposal.freelancer.toString() !== req.user._id.toString()) {
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
  if (proposal.freelancer.toString() !== req.user._id.toString()) {
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

  const proposal = await Proposal.findById(id).populate('project');
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

  // Clear cache
  await deleteCache(`proposals:project:${project._id}`);
  await deleteCache('projects:*');

  res.json({
    status: 'success',
    message: 'Proposal accepted successfully',
    data: {
      proposal: updatedProposal,
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
  if (proposal.freelancer.toString() !== req.user._id.toString()) {
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