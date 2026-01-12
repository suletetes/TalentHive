import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { Contract } from '@/models/Contract';
import { Payment } from '@/models/Payment';
import { Transaction } from '@/models/Transaction';
import { Review } from '@/models/Review';
import { AppError, catchAsync } from '@/middleware/errorHandler';

// Simple cache implementation (can be replaced with Redis in production)
const cache = new Map<string, { data: any; expiry: number }>();

const getCache = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key: string, data: any, ttlSeconds: number = 300): void => {
  cache.set(key, {
    data,
    expiry: Date.now() + (ttlSeconds * 1000),
  });
};

const deleteCache = (key: string): void => {
  cache.delete(key);
};

interface AuthRequest extends Request {
  user?: any;
}

export const getDashboardStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    totalProjects,
    totalContracts,
    revenueData,
    activeProjects,
    completedProjects,
  ] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Contract.countDocuments(),
    Transaction.aggregate([
      { $match: { status: { $in: ['completed', 'released', 'paid_out', 'held_in_escrow'] } } },
      { $group: { _id: null, total: { $sum: '$platformCommission' } } },
    ]),
    Project.countDocuments({ status: 'in_progress' }),
    Project.countDocuments({ status: 'completed' }),
  ]);

  // Calculate total revenue from platform commission
  const totalRevenue = revenueData[0]?.total || 0;

  res.json({
    status: 'success',
    data: {
      stats: {
        totalUsers,
        totalProjects,
        totalContracts,
        totalRevenue, // Now shows actual platform commission from transactions
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

  if (!['active', 'suspended', 'deactivated'].includes(accountStatus)) {
    return next(new AppError('Invalid account status', 400));
  }

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

export const updateUserRole = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['admin', 'freelancer', 'client'].includes(role)) {
    return next(new AppError('Invalid role', 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent changing own role
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('Cannot change your own role', 403));
  }

  user.role = role;
  await user.save();

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

// Assign role to user
export const assignRole = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { role } = req.body;

  const validRoles = ['admin', 'freelancer', 'client', 'work_verifier', 'moderator', 'support'];
  
  if (!validRoles.includes(role)) {
    return next(new AppError('Invalid role', 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Initialize roles array if it doesn't exist
  if (!user.roles || user.roles.length === 0) {
    user.roles = [user.role];
  }

  // Add role if not already present
  if (!user.roles.includes(role as any)) {
    user.roles.push(role as any);
    await user.save();

    // Clear user cache
    await deleteCache(`user:${userId}`);
  }

  res.json({
    status: 'success',
    message: 'Role assigned successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        primaryRole: user.role,
      },
    },
  });
});

// Remove role from user
export const removeRole = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { role } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Cannot remove primary role
  if (role === user.role) {
    return next(new AppError('Cannot remove primary role', 400));
  }

  // Remove role from array
  if (user.roles && user.roles.length > 0) {
    user.roles = user.roles.filter((r: string) => r !== role);
    await user.save();

    // Clear user cache
    await deleteCache(`user:${userId}`);
  }

  res.json({
    status: 'success',
    message: 'Role removed successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        primaryRole: user.role,
      },
    },
  });
});

// Feature a freelancer
export const featureFreelancer = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  console.log(' [FEATURE_FREELANCER] Starting feature process for user:', userId);

  const user = await User.findById(userId);
  if (!user) {
    console.log('  [FEATURE_FREELANCER] User not found:', userId);
    return next(new AppError('User not found', 404));
  }

  console.log(' [FEATURE_FREELANCER] User found:', user.profile?.firstName, user.profile?.lastName);
  console.log(' [FEATURE_FREELANCER] User role:', user.role);
  console.log(' [FEATURE_FREELANCER] Current isFeatured status:', user.isFeatured);

  if (user.role !== 'freelancer') {
    console.log('  [FEATURE_FREELANCER] User is not a freelancer');
    return next(new AppError('Only freelancers can be featured', 400));
  }

  if (user.isFeatured) {
    console.log('  [FEATURE_FREELANCER] Freelancer is already featured');
    return next(new AppError('Freelancer is already featured', 400));
  }

  // Get the highest featured order
  const highestOrder = await User.findOne({ isFeatured: true })
    .sort({ featuredOrder: -1 })
    .select('featuredOrder');

  console.log(' [FEATURE_FREELANCER] Highest featured order:', highestOrder?.featuredOrder);

  user.isFeatured = true;
  user.featuredOrder = highestOrder ? highestOrder.featuredOrder + 1 : 1;
  user.featuredSince = new Date();
  await user.save();

  console.log('  [FEATURE_FREELANCER] User updated - isFeatured:', user.isFeatured, 'featuredOrder:', user.featuredOrder);

  // Clear cache
  await deleteCache('featured-freelancers');
  await deleteCache(`user:${userId}`);
  console.log(' [FEATURE_FREELANCER] Cache cleared');

  res.json({
    status: 'success',
    message: 'Freelancer featured successfully',
    data: { user },
  });
});

// Unfeature a freelancer
export const unfeatureFreelancer = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  console.log(' [UNFEATURE_FREELANCER] Starting unfeature process for user:', userId);

  const user = await User.findById(userId);
  if (!user) {
    console.log('  [UNFEATURE_FREELANCER] User not found:', userId);
    return next(new AppError('User not found', 404));
  }

  console.log('  [UNFEATURE_FREELANCER] User found:', user.profile?.firstName, user.profile?.lastName);
  console.log(' [UNFEATURE_FREELANCER] Current isFeatured status:', user.isFeatured);

  if (!user.isFeatured) {
    console.log('  [UNFEATURE_FREELANCER] Freelancer is not featured');
    return next(new AppError('Freelancer is not featured', 400));
  }

  user.isFeatured = false;
  user.featuredOrder = 0;
  user.featuredSince = undefined;
  await user.save();

  console.log('  [UNFEATURE_FREELANCER] User updated - isFeatured:', user.isFeatured);

  // Clear cache
  await deleteCache('featured-freelancers');
  await deleteCache(`user:${userId}`);
  console.log(' [UNFEATURE_FREELANCER] Cache cleared');

  res.json({
    status: 'success',
    message: 'Freelancer unfeatured successfully',
    data: { user },
  });
});

// Get featured freelancers
export const getFeaturedFreelancers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('  [GET_FEATURED] Fetching featured freelancers...');
  
  // Check cache first
  let featuredFreelancers = await getCache('featured-freelancers');
  console.log(' [GET_FEATURED] Cache hit:', !!featuredFreelancers);

  if (!featuredFreelancers) {
    console.log(' [GET_FEATURED] Querying database for featured freelancers...');
    
    // First, check how many freelancers are marked as featured
    const totalFeatured = await User.countDocuments({
      role: 'freelancer',
      isFeatured: true,
    });
    console.log('  [GET_FEATURED] Total featured freelancers in DB:', totalFeatured);

    // Check how many are active
    const activeFeatured = await User.countDocuments({
      role: 'freelancer',
      isFeatured: true,
      isActive: true,
    });
    console.log('  [GET_FEATURED] Active featured freelancers in DB:', activeFeatured);

    featuredFreelancers = await User.find({
      role: 'freelancer',
      isFeatured: true,
      isActive: true,
    })
      .sort({ featuredOrder: 1 })
      .select('profile rating freelancerProfile isFeatured featuredOrder isActive')
      .limit(10);

    console.log('  [GET_FEATURED] Found', featuredFreelancers.length, 'featured freelancers');
    if (featuredFreelancers.length > 0) {
      console.log(' [GET_FEATURED] Featured freelancers:', featuredFreelancers.map(f => ({
        id: f._id,
        name: f.profile?.firstName,
        isFeatured: f.isFeatured,
        featuredOrder: f.featuredOrder,
        isActive: f.isActive,
      })));
    }

    // Cache for 1 hour
    await setCache('featured-freelancers', featuredFreelancers, 3600);
    console.log(' [GET_FEATURED] Cached featured freelancers');
  }

  console.log(' [GET_FEATURED] Returning', featuredFreelancers.length, 'freelancers to client');
  res.json({
    status: 'success',
    data: {
      freelancers: featuredFreelancers,
    },
  });
});

// Reorder featured freelancers
export const reorderFeaturedFreelancers = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { order } = req.body; // Array of user IDs in desired order

  if (!Array.isArray(order) || order.length === 0) {
    return next(new AppError('Order array is required', 400));
  }

  // Update featured order for each freelancer
  const updatePromises = order.map((userId, index) =>
    User.findByIdAndUpdate(userId, { featuredOrder: index + 1 })
  );

  await Promise.all(updatePromises);

  // Clear cache
  await deleteCache('featured-freelancers');

  res.json({
    status: 'success',
    message: 'Featured freelancers reordered successfully',
  });
});

// Get analytics data
export const getAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, category } = req.query;

  const dateFilter: any = {};
  if (startDate) {
    dateFilter.$gte = new Date(startDate as string);
  }
  if (endDate) {
    dateFilter.$lte = new Date(endDate as string);
  }

  // User growth over time
  const userGrowth = await User.aggregate([
    ...(Object.keys(dateFilter).length > 0 ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Revenue metrics (from completed contracts)
  const Contract = (await import('@/models/Contract')).Contract;
  const revenueData = await Contract.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        averageContractValue: { $avg: '$totalAmount' },
        totalContracts: { $sum: 1 },
      },
    },
  ]);

  // Project statistics
  const Project = (await import('@/models/Project')).Project;
  const projectStats = await Project.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Category distribution
  const categoryDistribution = category
    ? await Project.find({ category }).countDocuments()
    : await Project.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryInfo',
          },
        },
        {
          $unwind: {
            path: '$categoryInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            name: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
          },
        },
      ]);

  // Top freelancers by rating
  const topFreelancers = await User.find({ role: 'freelancer', isActive: true })
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(10)
    .select('profile rating freelancerProfile');

  // Top clients by spending
  const topClients = await Contract.aggregate([
    { $match: { status: { $in: ['active', 'completed'] } } },
    {
      $group: {
        _id: '$client',
        totalSpent: { $sum: '$totalAmount' },
        contractCount: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'clientInfo',
      },
    },
    { $unwind: '$clientInfo' },
  ]);

  res.json({
    status: 'success',
    data: {
      userGrowth,
      revenue: revenueData[0] || { totalRevenue: 0, averageContractValue: 0, totalContracts: 0 },
      projectStats,
      categoryDistribution,
      topFreelancers,
      topClients,
    },
  });
});

// Get user growth analytics
export const getUserGrowthAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          role: '$role',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  res.json({
    status: 'success',
    data: {
      userGrowth,
      startDate: start,
      endDate: end,
    },
  });
});

// Get revenue analytics
export const getRevenueAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const Payment = mongoose.model('Payment');
  
  const revenueData = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalAmount: { $sum: '$amount' },
        platformFee: { $sum: '$platformFee' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const totalRevenue = revenueData.reduce((sum, day) => sum + day.platformFee, 0);

  res.json({
    status: 'success',
    data: {
      revenueData,
      totalRevenue,
      startDate: start,
      endDate: end,
    },
  });
});

// Get project analytics
export const getProjectAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const Project = mongoose.model('Project');

  const [statusDistribution, categoryDistribution, completionStats] = await Promise.all([
    // Projects by status
    Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    
    // Projects by category
    Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgBudget: { $avg: '$budget.min' },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]),
    
    // Completion rate
    Project.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const completionRate = completionStats[0]
    ? (completionStats[0].completed / completionStats[0].total) * 100
    : 0;

  res.json({
    status: 'success',
    data: {
      statusDistribution,
      categoryDistribution,
      completionRate,
      totalProjects: completionStats[0]?.total || 0,
    },
  });
});

// Get top users analytics
export const getTopUsersAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { limit = 10 } = req.query;

  const [topFreelancers, topClients] = await Promise.all([
    // Top freelancers by rating and project count
    User.find({ role: 'freelancer', isActive: true })
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .select('profile rating freelancerProfile')
      .limit(parseInt(limit as string)),
    
    // Top clients by projects posted
    User.find({ role: 'client', isActive: true })
      .sort({ 'clientProfile.projectsPosted': -1 })
      .select('profile clientProfile')
      .limit(parseInt(limit as string)),
  ]);

  res.json({
    status: 'success',
    data: {
      topFreelancers,
      topClients,
    },
  });
});

// Get platform settings
export const getSettings = catchAsync(async (req: AuthRequest, res: Response) => {
  const { Settings } = await import('@/models/Settings');
  
  let settings = await Settings.findOne();
  
  // Create default settings if none exist
  if (!settings) {
    settings = new Settings({
      platformFee: 5,
      escrowPeriodDays: 7,
      minWithdrawalAmount: 10,
      commissionSettings: [
        {
          name: 'Standard Commission',
          commissionPercentage: 5,
          description: 'Default platform commission for all transactions',
          isActive: true,
        },
      ],
    });
    await settings.save();
  }

  res.json({
    status: 'success',
    data: settings,
  });
});

// Update platform settings
export const updateSettings = catchAsync(async (req: AuthRequest, res: Response) => {
  const { Settings } = await import('@/models/Settings');
  const { platformFee, escrowPeriodDays, minWithdrawalAmount, commissionSettings, maintenanceMode } = req.body;

  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = new Settings();
  }

  if (platformFee !== undefined) settings.platformFee = platformFee;
  if (escrowPeriodDays !== undefined) settings.escrowPeriodDays = escrowPeriodDays;
  if (minWithdrawalAmount !== undefined) settings.minWithdrawalAmount = minWithdrawalAmount;
  if (commissionSettings !== undefined) settings.commissionSettings = commissionSettings;
  if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;

  await settings.save();

  res.json({
    status: 'success',
    message: 'Settings updated successfully',
    data: settings,
  });
});

// Get commission settings
export const getCommissionSettings = catchAsync(async (req: AuthRequest, res: Response) => {
  const { Settings } = await import('@/models/Settings');
  
  let settings = await Settings.findOne();
  
  if (!settings) {
    // Create default settings
    settings = new Settings({
      platformFee: 5,
      commissionSettings: [
        {
          name: 'Standard Commission',
          commissionPercentage: 5,
          description: 'Default platform commission for all transactions',
          isActive: true,
        },
      ],
    });
    await settings.save();
  }

  res.json({
    status: 'success',
    data: settings.commissionSettings || [],
  });
});

// Update commission settings
export const updateCommissionSettings = catchAsync(async (req: AuthRequest, res: Response) => {
  const { Settings } = await import('@/models/Settings');
  const { commissionSettings } = req.body;

  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = new Settings();
  }

  settings.commissionSettings = commissionSettings;
  await settings.save();

  res.json({
    status: 'success',
    message: 'Commission settings updated successfully',
    data: settings.commissionSettings,
  });
});
