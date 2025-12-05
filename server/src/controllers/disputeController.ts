import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Dispute } from '@/models/Dispute';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { notificationService } from '@/services/notification.service';

interface AuthRequest extends Request {
  user?: any;
}

export const createDisputeValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  body('type').isIn(['project', 'contract', 'payment', 'user', 'other']).withMessage('Invalid dispute type'),
];

// Create a new dispute
export const createDispute = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  const userId = req.user?._id;
  const { title, description, type, respondent, project, contract, transaction, evidence, priority } = req.body;

  const dispute = new Dispute({
    title,
    description,
    type,
    complainant: userId,
    respondent,
    project,
    contract,
    transaction,
    evidence: evidence || [],
    priority: priority || 'medium',
    status: 'open',
  });

  await dispute.save();

  // Notify admins about new dispute
  try {
    const { User } = await import('@/models/User');
    const admins = await User.find({ role: 'admin' }).select('_id');
    
    for (const admin of admins) {
      await notificationService.notifySystem(
        admin._id.toString(),
        'New Dispute Filed',
        `A new ${type} dispute has been filed: ${title}`,
        `/admin/disputes/${dispute._id}`,
        'high'
      );
    }
  } catch (error) {
    console.error('Failed to notify admins about dispute:', error);
  }

  res.status(201).json({
    status: 'success',
    message: 'Dispute created successfully',
    data: {
      dispute,
    },
  });
});

// Get all disputes (admin only)
export const getAllDisputes = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, status, priority, type } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const query: any = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (type) query.type = type;

  const [disputes, total] = await Promise.all([
    Dispute.find(query)
      .populate('complainant', 'profile email')
      .populate('respondent', 'profile email')
      .populate('assignedAdmin', 'profile email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Dispute.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      disputes,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

// Get user's disputes
export const getMyDisputes = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const query: any = {
    $or: [
      { complainant: userId },
      { respondent: userId },
    ],
  };
  if (status) query.status = status;

  const [disputes, total] = await Promise.all([
    Dispute.find(query)
      .populate('complainant', 'profile email')
      .populate('respondent', 'profile email')
      .populate('assignedAdmin', 'profile email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Dispute.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      disputes,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

// Get dispute by ID
export const getDisputeById = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  const dispute = await Dispute.findById(id)
    .populate('complainant', 'profile email')
    .populate('respondent', 'profile email')
    .populate('assignedAdmin', 'profile email')
    .populate('project', 'title')
    .populate('contract', 'title')
    .populate({
      path: 'messages.sender',
      select: 'profile email role',
    });

  if (!dispute) {
    return next(new AppError('Dispute not found', 404));
  }

  // Check access: admin, complainant, or respondent
  const isInvolved = 
    userRole === 'admin' ||
    dispute.complainant._id.toString() === userId.toString() ||
    (dispute.respondent && dispute.respondent._id.toString() === userId.toString());

  if (!isInvolved) {
    return next(new AppError('You do not have access to this dispute', 403));
  }

  res.json({
    status: 'success',
    data: {
      dispute,
    },
  });
});

// Add message to dispute
export const addDisputeMessage = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  if (!message || message.trim().length === 0) {
    return next(new AppError('Message is required', 400));
  }

  const dispute = await Dispute.findById(id);
  if (!dispute) {
    return next(new AppError('Dispute not found', 404));
  }

  // Check access
  const isInvolved = 
    userRole === 'admin' ||
    dispute.complainant.toString() === userId.toString() ||
    (dispute.respondent && dispute.respondent.toString() === userId.toString());

  if (!isInvolved) {
    return next(new AppError('You do not have access to this dispute', 403));
  }

  dispute.messages.push({
    sender: userId,
    message: message.trim(),
    timestamp: new Date(),
    isAdminMessage: userRole === 'admin',
  } as any);

  await dispute.save();

  // Notify other parties
  try {
    const notifyUsers = [dispute.complainant.toString()];
    if (dispute.respondent) notifyUsers.push(dispute.respondent.toString());
    if (dispute.assignedAdmin) notifyUsers.push(dispute.assignedAdmin.toString());

    for (const notifyUserId of notifyUsers) {
      if (notifyUserId !== userId.toString()) {
        await notificationService.notifySystem(
          notifyUserId,
          'New Dispute Message',
          `New message in dispute: ${dispute.title}`,
          `/disputes/${dispute._id}`,
          'normal'
        );
      }
    }
  } catch (error) {
    console.error('Failed to send dispute message notifications:', error);
  }

  res.json({
    status: 'success',
    message: 'Message added successfully',
    data: {
      dispute,
    },
  });
});

// Update dispute status (admin only)
export const updateDisputeStatus = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status, resolution } = req.body;
  const userId = req.user?._id;

  const dispute = await Dispute.findById(id);
  if (!dispute) {
    return next(new AppError('Dispute not found', 404));
  }

  if (status) dispute.status = status;
  if (resolution) dispute.resolution = resolution;

  if (status === 'resolved' || status === 'closed') {
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = userId;
  }

  await dispute.save();

  // Notify parties
  try {
    const notifyUsers = [dispute.complainant.toString()];
    if (dispute.respondent) notifyUsers.push(dispute.respondent.toString());

    for (const notifyUserId of notifyUsers) {
      await notificationService.notifySystem(
        notifyUserId,
        'Dispute Status Updated',
        `Your dispute "${dispute.title}" has been ${status}`,
        `/disputes/${dispute._id}`,
        'high'
      );
    }
  } catch (error) {
    console.error('Failed to send dispute status notifications:', error);
  }

  res.json({
    status: 'success',
    message: 'Dispute updated successfully',
    data: {
      dispute,
    },
  });
});

// Assign dispute to admin (admin only)
export const assignDispute = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { adminId } = req.body;

  const dispute = await Dispute.findById(id);
  if (!dispute) {
    return next(new AppError('Dispute not found', 404));
  }

  dispute.assignedAdmin = adminId || req.user?._id;
  dispute.status = 'in_review';
  await dispute.save();

  res.json({
    status: 'success',
    message: 'Dispute assigned successfully',
    data: {
      dispute,
    },
  });
});

// Get dispute statistics (admin only)
export const getDisputeStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const [total, open, inReview, resolved, closed, byType, byPriority] = await Promise.all([
    Dispute.countDocuments(),
    Dispute.countDocuments({ status: 'open' }),
    Dispute.countDocuments({ status: 'in_review' }),
    Dispute.countDocuments({ status: 'resolved' }),
    Dispute.countDocuments({ status: 'closed' }),
    Dispute.aggregate([
      { $group: { _id: '$type', count: { $count: {} } } },
    ]),
    Dispute.aggregate([
      { $group: { _id: '$priority', count: { $count: {} } } },
    ]),
  ]);

  res.json({
    status: 'success',
    data: {
      total,
      open,
      inReview,
      resolved,
      closed,
      byType,
      byPriority,
    },
  });
});
