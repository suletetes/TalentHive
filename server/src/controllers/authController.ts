import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { User } from '@/models/User';
import { generateTokens, verifyToken } from '@/utils/jwt';
import { sendVerificationEmail } from '@/utils/email';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { deleteCache } from '@/config/redis';

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').isIn(['freelancer', 'client', 'admin']).withMessage('Invalid role'),
];

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  const { email, password, firstName, lastName, role, companyName, title } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400));
  }

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user object
  const userData: any = {
    email,
    password,
    role,
    profile: {
      firstName,
      lastName,
    },
    emailVerificationToken,
    emailVerificationExpires,
  };

  // Add role-specific data
  if (role === 'freelancer') {
    userData.freelancerProfile = {
      title: title || '',
      hourlyRate: 0,
      skillRates: [],
      skills: [],
      experience: '',
      portfolio: [],
      availability: {
        status: 'available',
        schedule: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: []
        },
        calendar: [],
      },
      servicePackages: [],
      certifications: [],
      timeTracking: {
        isEnabled: false,
        activityMonitoring: false,
      },
    };
  } else if (role === 'client') {
    userData.clientProfile = {
      companyName: companyName || '',
      industry: '',
      projectsPosted: 0,
      preferredVendors: [],
      projectTemplates: [],
    };
  }

  const user = new User(userData);
  await user.save();

  // Send verification email
  try {
    await sendVerificationEmail(email, emailVerificationToken);
  } catch (error) {
    // If email fails, still return success but log the error
    console.error('Failed to send verification email:', error);
  }

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        isVerified: user.isVerified,
      },
    },
  });
});

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated', 401));
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
  });

  // Remove password from response
  user.password = undefined as any;

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        isVerified: user.isVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    const decoded = verifyToken(refreshToken, true);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return next(new AppError('Invalid refresh token', 401));
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      status: 'success',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    next(new AppError('Invalid refresh token', 401));
  }
});

export const logout = catchAsync(async (req: any, res: Response, next: NextFunction) => {
  // Clear user cache
  if (req.user) {
    await deleteCache(`user:${req.user._id}`);
  }

  res.json({
    status: 'success',
    message: 'Logout successful',
  });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({
    status: 'success',
    message: 'Email verified successfully',
  });
});