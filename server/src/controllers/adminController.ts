import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { Contract } from '@/models/Contract';
import { Payment } from '@/models/Payment';
import { Review } from '@/models/Review';
import { AppError, catchAsync } from '@/middleware/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

export const getDashboardStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    totalProjects,
    totalContracts,
    totalRevenue,
    activeProjects,
    completedProjects,
  ] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Contract.countDocuments(),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]),
    Project.countDocuments({ status: 'in_progress' }),
    Project.countDocuments({ status: 'completed' }),
  ]);

  res.json({
    status: 'success',
    data: {
      stats: {
        totalUsers,
        totalProjects,
        totalContracts,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeProjects,
        completedProjects,
      },
    },
  });
});

export const getUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, role, status, search } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const query: any = {};
  if (role) query.role = role;
  if (status) query.accountStatus = status;
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    User.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const updateUserStatus = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { accountStatus } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { accountStatus },
    { new: true, select: '-password' }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    status: 'success',
    data: { user },
  });
});

export const getReports = catchAsync(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate as string);
  if (endDate) dateFilter.$lte = new Date(endDate as string);

  const [userGrowth, revenueData, projectStats] = await Promise.all([
    User.aggregate([
      { $match: dateFilter.$gte ? { createdAt: dateFilter } : {} },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', ...(dateFilter.$gte ? { createdAt: dateFilter } : {}) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$platformFee' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    status: 'success',
    data: {
      userGrowth,
      revenueData,
      projectStats,
    },
  });
});