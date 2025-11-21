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

// Forgot password validation
export const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
];

// Forgot password - send reset email
export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Please provide a valid email', 400));
  }

  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({
      status: 'success',
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save reset token to user
  user.passwordResetToken = passwordResetToken;
  user.passwordResetExpires = passwordResetExpires;
  await user.save({ validateBeforeSave: false });

  // Send reset email using email service
  try {
    const { emailService } = await import('@/services/email.service');
    await emailService.sendPasswordResetEmail(
      user.email,
      user.profile.firstName,
      resetToken
    );

    res.json({
      status: 'success',
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    // Clear reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Failed to send password reset email. Please try again later.', 500));
  }
});

// Reset password validation
export const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

// Reset password
export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  const { token } = req.params;
  const { password } = req.body;

  // Hash the token from URL to compare with stored hash
  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password');

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Clear user cache
  await deleteCache(`user:${user._id}`);

  // Generate new tokens
  const tokens = generateTokens({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.json({
    status: 'success',
    message: 'Password reset successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      ...tokens,
    },
  });
});

// Verify reset token
export const verifyResetToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;

  // Hash the token from URL
  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  res.json({
    status: 'success',
    message: 'Token is valid',
    data: {
      email: user.email,
    },
  });
});
