import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '@/models/User';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { deleteCache, setCache } from '@/config/redis';

interface AuthRequest extends Request {
  user?: any;
}

export const getProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const user = await User.findById(userId).populate('clientProfile.preferredVendors', 'profile rating');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    status: 'success',
    data: {
      user,
    },
  });
});

export const updateProfileValidation = [
  body('profile.firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('profile.lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
  body('profile.bio').optional().isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
  body('profile.location').optional().trim(),
  body('profile.timezone').optional().trim(),
];

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  const { profile, freelancerProfile, clientProfile } = req.body;
  const userId = req.user._id;

  const updateData: any = {};
  
  if (profile) {
    updateData.profile = { ...req.user.profile, ...profile };
  }

  if (freelancerProfile && req.user.role === 'freelancer') {
    updateData.freelancerProfile = { ...req.user.freelancerProfile, ...freelancerProfile };
  }

  if (clientProfile && req.user.role === 'client') {
    updateData.clientProfile = { ...req.user.clientProfile, ...clientProfile };
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Clear user cache
  await deleteCache(`user:${userId}`);

  res.json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});

export const getFreelancers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { 
    page = 1, 
    limit = 10, 
    skills, 
    minRating, 
    maxRate, 
    availability,
    search,
    sortBy = 'rating.average',
    sortOrder = 'desc'
  } = req.query;

  const query: any = { 
    role: 'freelancer', 
    isActive: true,
    isVerified: true 
  };

  // Add filters
  if (skills) {
    const skillsArray = (skills as string).split(',');
    query['freelancerProfile.skills'] = { $in: skillsArray };
  }

  if (minRating) {
    query['rating.average'] = { $gte: parseFloat(minRating as string) };
  }

  if (maxRate) {
    query['freelancerProfile.hourlyRate'] = { $lte: parseFloat(maxRate as string) };
  }

  if (availability) {
    query['freelancerProfile.availability.status'] = availability;
  }

  if (search) {
    query.$or = [
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } },
      { 'freelancerProfile.title': { $regex: search, $options: 'i' } },
      { 'freelancerProfile.skills': { $regex: search, $options: 'i' } },
    ];
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const [freelancers, total] = await Promise.all([
    User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string)),
    User.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      freelancers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const getFreelancerById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  console.log(`[FREELANCER DETAIL] Fetching freelancer with ID: ${id}`);

  const freelancer = await User.findOne({
    _id: id,
    role: 'freelancer',
    isActive: true,
  }).select('-password -emailVerificationToken -passwordResetToken');

  console.log(`[FREELANCER DETAIL] Found freelancer:`, freelancer ? 'YES' : 'NO');

  if (!freelancer) {
    console.log(`[FREELANCER DETAIL] Freelancer not found for ID: ${id}`);
    return next(new AppError('Freelancer not found', 404));
  }

  res.json({
    status: 'success',
    data: {
      freelancer,
    },
  });
});

export const addSkill = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { skill, rate } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (req.user?.role !== 'freelancer') {
    return next(new AppError('Only freelancers can add skills', 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if skill already exists
  const existingSkill = user.freelancerProfile?.skills.includes(skill);
  if (existingSkill) {
    return next(new AppError('Skill already exists', 400));
  }

  // Add skill to skills array
  if (!user.freelancerProfile?.skills) {
    user.freelancerProfile!.skills = [];
  }
  user.freelancerProfile!.skills.push(skill);

  // Add skill rate if provided
  if (rate && rate > 0) {
    if (!user.freelancerProfile?.skillRates) {
      user.freelancerProfile!.skillRates = [];
    }
    user.freelancerProfile!.skillRates.push({ skill, rate });
  }

  await user.save();
  await deleteCache(`user:${userId}`);

  res.json({
    status: 'success',
    message: 'Skill added successfully',
    data: {
      skills: user.freelancerProfile?.skills,
      skillRates: user.freelancerProfile?.skillRates,
    },
  });
});

export const removeSkill = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { skill } = req.params;
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (req.user?.role !== 'freelancer') {
    return next(new AppError('Only freelancers can remove skills', 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Remove skill from skills array
  if (user.freelancerProfile?.skills) {
    user.freelancerProfile.skills = user.freelancerProfile.skills.filter(s => s !== skill);
  }

  // Remove skill rate
  if (user.freelancerProfile?.skillRates) {
    user.freelancerProfile.skillRates = user.freelancerProfile.skillRates.filter(sr => sr.skill !== skill);
  }

  await user.save();
  await deleteCache(`user:${userId}`);

  res.json({
    status: 'success',
    message: 'Skill removed successfully',
    data: {
      skills: user.freelancerProfile?.skills,
      skillRates: user.freelancerProfile?.skillRates,
    },
  });
});

export const updateAvailability = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status, schedule, calendar } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (req.user?.role !== 'freelancer') {
    return next(new AppError('Only freelancers can update availability', 403));
  }

  const updateData: any = {};
  
  if (status) {
    updateData['freelancerProfile.availability.status'] = status;
  }
  
  if (schedule) {
    updateData['freelancerProfile.availability.schedule'] = schedule;
  }
  
  if (calendar) {
    updateData['freelancerProfile.availability.calendar'] = calendar;
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  await deleteCache(`user:${userId}`);

  res.json({
    status: 'success',
    message: 'Availability updated successfully',
    data: {
      availability: user.freelancerProfile?.availability,
    },
  });
});

export const addPortfolioItem = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, description, images, projectUrl, technologies, completedAt } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (req.user?.role !== 'freelancer') {
    return next(new AppError('Only freelancers can add portfolio items', 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const portfolioItem = {
    title,
    description,
    images: images || [],
    projectUrl,
    technologies: technologies || [],
    completedAt: completedAt || new Date(),
  };

  if (!user.freelancerProfile?.portfolio) {
    user.freelancerProfile!.portfolio = [];
  }

  user.freelancerProfile!.portfolio.push(portfolioItem as any);
  await user.save();
  await deleteCache(`user:${userId}`);

  res.json({
    status: 'success',
    message: 'Portfolio item added successfully',
    data: {
      portfolio: user.freelancerProfile?.portfolio,
    },
  });
});

export const updatePortfolioItem = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { itemId } = req.params;
  const updateData = req.body;
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (req.user?.role !== 'freelancer') {
    return next(new AppError('Only freelancers can update portfolio items', 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const portfolioItem = user.freelancerProfile?.portfolio?.find(item => item._id?.toString() === itemId);
  if (!portfolioItem) {
    return next(new AppError('Portfolio item not found', 404));
  }

  Object.assign(portfolioItem, updateData);
  await user.save();
  await deleteCache(`user:${userId}`);

  res.json({
    status: 'success',
    message: 'Portfolio item updated successfully',
    data: {
      portfolioItem,
    },
  });
});

export const deletePortfolioItem = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { itemId } = req.params;
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (req.user?.role !== 'freelancer') {
    return next(new AppError('Only freelancers can delete portfolio items', 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.freelancerProfile?.portfolio) {
    return next(new AppError('Portfolio item not found', 404));
  }

  user.freelancerProfile.portfolio = user.freelancerProfile.portfolio.filter(
    (item: any) => item._id.toString() !== itemId
  );

  await user.save();
  await deleteCache(`user:${userId}`);

  res.json({
    status: 'success',
    message: 'Portfolio item deleted successfully',
  });
});

// Change password validation
export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

// Change password
export const changePassword = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password field
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Check if new password is same as current
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    return next(new AppError('New password must be different from current password', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Clear user cache
  await deleteCache(`user:${user._id}`);

  res.json({
    status: 'success',
    message: 'Password changed successfully',
  });
});
