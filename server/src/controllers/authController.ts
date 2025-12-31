import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { User } from '@/models/User';
import { generateTokens, verifyToken } from '@/utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/utils/email.resend';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { deleteCache } from '@/config/redis';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/middleware/auth';
import { ResponseFormatter } from '@/utils/standardResponse';

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('role').isIn(['freelancer', 'client', 'admin']).withMessage('Invalid role'),
  body().custom((value, { req }) => {
    const firstName = req.body.firstName || req.body.profile?.firstName;
    const lastName = req.body.lastName || req.body.profile?.lastName;
    
    if (!firstName || !firstName.toString().trim()) {
      throw new Error('First name is required');
    }
    if (!lastName || !lastName.toString().trim()) {
      throw new Error('Last name is required');
    }
    return true;
  }),
];


export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('📝 Register request body:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  console.log('🔍 Validation errors:', errors.array());

  if (!errors.isEmpty()) {
    console.log('❌ Validation failed with errors:', errors.array());
    return next(new AppError('Validation failed', 400));
  }

  const { email, password, firstName, lastName, role, companyName, title, profile } = req.body;

  console.log('📋 Extracted fields:', { email, firstName, lastName, role, profile });

  // Support both root-level and nested profile format
  const finalFirstName = firstName || profile?.firstName;
  const finalLastName = lastName || profile?.lastName;

  console.log('✅ Final names:', { finalFirstName, finalLastName });

  if (!finalFirstName || !finalLastName) {
    console.log('❌ Missing names - finalFirstName:', finalFirstName, 'finalLastName:', finalLastName);
    return next(new AppError('First name and last name are required', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400));
  }

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Hash the token before storing
  const hashedToken = crypto.createHash('sha256').update(emailVerificationToken).digest('hex');

  // Create user object
  const userData: any = {
    email,
    password,
    role,
    profile: {
      firstName: finalFirstName,
      lastName: finalLastName,
    },
    emailVerificationToken: hashedToken,
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
  
  try {
    await user.save();
  } catch (error: any) {
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.email) {
      return next(new AppError('An account with this email already exists', 409));
    }
    // Handle other validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return next(new AppError(`Validation failed: ${messages.join(', ')}`, 400));
    }
    throw error; // Re-throw other errors
  }

  // TODO: Re-enable email verification when email service is fixed
  // await sendVerificationEmail(email, emailVerificationToken);

  // Auto-verify user for now (email verification disabled)
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return ResponseFormatter.success(res, 'User registered successfully. You can now login.', {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      isVerified: user.isVerified,
    },
  }, 201);
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

  if (!user.isVerified) {
    return next(new AppError('Please verify your email before logging in. Check your inbox for the verification link.', 403));
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
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
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

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
];

export const changePassword = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user._id;

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    return next(new AppError('New password and confirm password do not match', 400));
  }

  // Validate new password is different from current
  if (currentPassword === newPassword) {
    return next(new AppError('New password must be different from current password', 400));
  }

  // Get user with password field
  const user = await User.findById(userId).select('+password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Clear user cache
  await deleteCache(`user:${userId}`);

  res.json({
    status: 'success',
    message: 'Password changed successfully',
  });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;

  console.log('🔍 [VERIFY_EMAIL] Starting verification');
  console.log('📝 [VERIFY_EMAIL] Token:', token);
  console.log('⏰ [VERIFY_EMAIL] Current time:', new Date().toISOString());

  if (!token) {
    console.log('❌ [VERIFY_EMAIL] No token provided');
    return next(new AppError('No verification token provided', 400));
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  console.log('🔐 [VERIFY_EMAIL] Plain token:', token);
  console.log('🔐 [VERIFY_EMAIL] Hashed token:', hashedToken);

  // Search for user with this token hash (new format) OR plain token (old format for backward compatibility)
  console.log('🔎 [VERIFY_EMAIL] Searching for user with this token in database...');
  
  // First try to find with hashed token
  let userWithToken = await User.findOne({
    emailVerificationToken: hashedToken,
  });

  // If not found, try with plain token (backward compatibility)
  if (!userWithToken) {
    console.log('🔎 [VERIFY_EMAIL] Hashed token not found, trying plain token...');
    userWithToken = await User.findOne({
      emailVerificationToken: token,
    });
  }

  if (!userWithToken) {
    console.log('❌ [VERIFY_EMAIL] Token does not exist in database');
    console.log('💡 [VERIFY_EMAIL] Searched for:');
    console.log('   - Hashed:', hashedToken);
    console.log('   - Plain:', token);
    
    // Debug: Check if there are ANY users with verification tokens
    const usersWithTokens = await User.find({
      emailVerificationToken: { $exists: true, $ne: null }
    }).select('email emailVerificationToken');
    console.log('📊 [VERIFY_EMAIL] Users with tokens in DB:', usersWithTokens.length);
    if (usersWithTokens.length > 0) {
      console.log('📊 [VERIFY_EMAIL] Sample tokens:', usersWithTokens.slice(0, 3).map(u => ({ email: u.email, tokenLength: u.emailVerificationToken?.length })));
    }
    
    return next(new AppError('Invalid or already used verification token', 400));
  }

  console.log('✅ [VERIFY_EMAIL] User found with token:', userWithToken.email);
  console.log('📋 [VERIFY_EMAIL] User ID:', userWithToken._id);
  console.log('📋 [VERIFY_EMAIL] Current isVerified status:', userWithToken.isVerified);
  console.log('📋 [VERIFY_EMAIL] Token expires at:', userWithToken.emailVerificationExpires);

  // Check if already verified
  if (userWithToken.isVerified) {
    console.log('⚠️ [VERIFY_EMAIL] User already verified, returning success');
    return res.status(200).json({
      status: 'success',
      message: 'Email already verified',
    });
  }

  // Check if token is expired
  if (userWithToken.emailVerificationExpires && userWithToken.emailVerificationExpires < new Date()) {
    console.log('⚠️ [VERIFY_EMAIL] Token has expired');
    return next(new AppError('Verification token has expired. Please request a new verification email.', 400));
  }

  // Token is valid and not expired - verify the user
  console.log('🔄 [VERIFY_EMAIL] Verifying user...');
  userWithToken.isVerified = true;
  userWithToken.emailVerificationToken = undefined;
  userWithToken.emailVerificationExpires = undefined;

  await userWithToken.save();

  console.log('✅ [VERIFY_EMAIL] User verified successfully');
  res.status(200).json({
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

  // Generate reset token with longer expiry
  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours instead of 1 hour

  // Save reset token to user
  user.passwordResetToken = passwordResetToken;
  user.passwordResetExpires = passwordResetExpires;
  await user.save({ validateBeforeSave: false });

  // Send reset email
  try {
    await sendPasswordResetEmail(user.email, resetToken);

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
