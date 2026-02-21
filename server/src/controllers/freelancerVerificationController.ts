import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User';
import { AppError } from '@/middleware/errorHandler';
import { AuthRequest } from '@/middleware/auth';
import { sendEmail } from '@/utils/email.resend';

/**
 * Check if freelancer meets requirements for a specific badge type
 */
function checkBadgeRequirements(user: any, badgeType: string): { qualifies: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (badgeType === 'identity') {
    if (!user.profile?.avatar) missing.push('Profile photo required');
    if (!user.profile?.firstName || !user.profile?.lastName) missing.push('Full name required');
    if (!user.profile?.location) missing.push('Location required');
    if (!user.profile?.bio || user.profile.bio.length < 100) missing.push('Bio must be at least 100 characters');
    if (!user.isVerified) missing.push('Email must be verified');
  }
  
  if (badgeType === 'skills') {
    if (!user.hasBadge('identity')) missing.push('Identity verification required first');
    if (!user.skills || user.skills.length < 3) missing.push('At least 3 skills required');
    if (!user.portfolio || user.portfolio.length < 2) missing.push('At least 2 portfolio items required');
    
    // Check portfolio item quality
    if (user.portfolio && user.portfolio.length >= 2) {
      user.portfolio.forEach((item: any, index: number) => {
        if (!item.description || item.description.length < 100) {
          missing.push(`Portfolio item ${index + 1}: Description must be at least 100 characters`);
        }
      });
    }
  }
  
  if (badgeType === 'trusted') {
    if (!user.hasBadge('identity')) missing.push('Identity verification required');
    if (!user.hasBadge('skills')) missing.push('Skills verification required');
    if (!user.qualifiesForTrustedBadge()) {
      missing.push('Does not meet performance criteria (5+ projects, 4.5+ rating, 90+ days active)');
    }
  }
  
  return {
    qualifies: missing.length === 0,
    missing
  };
}

/**
 * Request verification badge
 * POST /api/verification/request/:badgeType
 */
export const requestVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { badgeType } = req.params;
    const userId = req.user!._id;
    
    // Validate badge type
    if (!['identity', 'skills', 'trusted'].includes(badgeType)) {
      return next(new AppError('Invalid badge type', 400));
    }
    
    // Get user with full data
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Only freelancers can request verification
    if (user.role !== 'freelancer') {
      return next(new AppError('Only freelancers can request verification', 403));
    }
    
    // Check if already has this badge
    if (user.hasBadge(badgeType)) {
      return next(new AppError(`You already have the ${badgeType} verification badge`, 400));
    }
    
    // Check if already has pending request for this badge
    const existingBadge = user.getBadgeStatus(badgeType);
    if (existingBadge && existingBadge.status === 'pending') {
      return next(new AppError(`You already have a pending ${badgeType} verification request`, 400));
    }
    
    // Check requirements
    const requirements = checkBadgeRequirements(user, badgeType);
    if (!requirements.qualifies) {
      res.status(400).json({
        status: 'error',
        message: `Requirements not met for ${badgeType} verification`,
        data: {
          missing: requirements.missing
        }
      });
      return;
    }
    
    // Add verification request
    user.verificationBadges.push({
      type: badgeType,
      status: 'pending',
      requestedAt: new Date(),
    } as any);
    
    await user.save();
    
    // Send email notification to user
    await sendEmail({
      to: user.email,
      subject: `Verification Request Received - ${badgeType.charAt(0).toUpperCase() + badgeType.slice(1)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Verification Request Received</h2>
          <p>Hi ${user.profile.firstName},</p>
          <p>Your request for <strong>${badgeType} verification</strong> has been received!</p>
          <p>Our team will review your profile within 24-48 hours. You'll receive an email once the review is complete.</p>
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>Admin reviews your profile/portfolio</li>
            <li>You'll be notified of the decision</li>
            <li>If approved, the badge will appear on your profile</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Status
            </a>
          </div>
          <p>Best regards,<br>TalentHive Team</p>
        </div>
      `,
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Verification request submitted successfully',
      data: {
        badgeType,
        status: 'pending',
        requestedAt: new Date()
      }
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to request verification', 500));
  }
};

/**
 * Get verification status for current user
 * GET /api/verification/status
 */
export const getVerificationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    const badges = ['identity', 'skills', 'trusted'].map(type => {
      const badge = user.getBadgeStatus(type);
      
      if (badge) {
        return {
          type,
          status: badge.status,
          requestedAt: badge.requestedAt,
          reviewedAt: badge.reviewedAt,
          approvedAt: badge.approvedAt,
          rejectedAt: badge.rejectedAt,
          rejectionReason: badge.rejectionReason
        };
      }
      
      // Check if qualifies
      const requirements = checkBadgeRequirements(user, type);
      
      return {
        type,
        status: 'not_requested',
        qualifies: requirements.qualifies,
        requirements: requirements.qualifies ? null : { missing: requirements.missing }
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: { badges }
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get verification status', 500));
  }
};

/**
 * Cancel verification request
 * DELETE /api/verification/request/:badgeType
 */
export const cancelVerificationRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { badgeType } = req.params;
    const userId = req.user!._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Find and remove pending badge
    const badgeIndex = user.verificationBadges.findIndex(
      (b: any) => b.type === badgeType && b.status === 'pending'
    );
    
    if (badgeIndex === -1) {
      return next(new AppError('No pending verification request found', 404));
    }
    
    user.verificationBadges.splice(badgeIndex, 1);
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Verification request cancelled'
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to cancel verification request', 500));
  }
};

/**
 * Get pending verifications (Admin only)
 * GET /api/admin/verification/pending
 */
export const getPendingVerifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { badgeType, page = 1, limit = 20 } = req.query;
    
    const query: any = {
      role: 'freelancer',
      'verificationBadges.status': 'pending'
    };
    
    if (badgeType && badgeType !== 'all') {
      query['verificationBadges.type'] = badgeType;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await User.find(query)
      .select('profile email profileSlug verificationBadges skills portfolio rating createdAt')
      .skip(skip)
      .limit(Number(limit))
      .sort({ 'verificationBadges.requestedAt': -1 });
    
    const total = await User.countDocuments(query);
    
    // Format response
    const requests = users.flatMap(user => 
      user.verificationBadges
        .filter((badge: any) => badge.status === 'pending')
        .filter((badge: any) => !badgeType || badgeType === 'all' || badge.type === badgeType)
        .map((badge: any) => ({
          requestId: badge._id,
          freelancer: {
            _id: user._id,
            fullName: `${user.profile.firstName} ${user.profile.lastName}`,
            email: user.email,
            profileSlug: user.profileSlug,
            profile: user.profile,
            skills: user.skills,
            portfolio: user.portfolio,
            rating: user.rating
          },
          badgeType: badge.type,
          requestedAt: badge.requestedAt,
          requirements: checkBadgeRequirements(user, badge.type)
        }))
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get pending verifications', 500));
  }
};

/**
 * Review verification request (Admin only)
 * POST /api/admin/verification/review
 */
export const reviewVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, badgeType, action, notes, rejectionReason } = req.body;
    const adminId = req.user!._id;
    
    if (!['approve', 'reject'].includes(action)) {
      return next(new AppError('Invalid action. Must be approve or reject', 400));
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Find the badge
    const badge = user.verificationBadges.find(
      (b: any) => b.type === badgeType && b.status === 'pending'
    );
    
    if (!badge) {
      return next(new AppError('No pending verification request found', 404));
    }
    
    // Update badge
    badge.status = action === 'approve' ? 'approved' : 'rejected';
    badge.reviewedAt = new Date();
    badge.reviewedBy = adminId as any;
    badge.notes = notes;
    
    if (action === 'approve') {
      badge.approvedAt = new Date();
    } else {
      badge.rejectedAt = new Date();
      badge.rejectionReason = rejectionReason;
    }
    
    await user.save();
    
    // Send email notification
    const badgeLabel = badgeType.charAt(0).toUpperCase() + badgeType.slice(1);
    
    if (action === 'approve') {
      await sendEmail({
        to: user.email,
        subject: `Congratulations! ${badgeLabel} Verification Approved`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Congratulations! 🎉</h2>
            <p>Hi ${user.profile.firstName},</p>
            <p>Great news! Your <strong>${badgeLabel} verification</strong> has been approved!</p>
            <p>Your new badge is now visible on your profile, helping you stand out to potential clients.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/freelancer/${user.profileSlug}" 
                 style="background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Your Profile
              </a>
            </div>
            ${badgeType === 'identity' ? '<p><strong>Next Step:</strong> Request Skills Verification to further build your credibility!</p>' : ''}
            ${badgeType === 'skills' ? '<p><strong>Next Step:</strong> Keep building your reputation to earn the Trusted Freelancer badge!</p>' : ''}
            <p>Best regards,<br>TalentHive Team</p>
          </div>
        `,
      });
    } else {
      await sendEmail({
        to: user.email,
        subject: `${badgeLabel} Verification Update`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Verification Request Update</h2>
            <p>Hi ${user.profile.firstName},</p>
            <p>Thank you for submitting your <strong>${badgeLabel} verification</strong> request.</p>
            <p>After review, we're unable to approve your request at this time.</p>
            <p><strong>Reason:</strong> ${rejectionReason}</p>
            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Update your profile based on the feedback above</li>
              <li>Ensure all requirements are met</li>
              <li>Resubmit your request when ready</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" 
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Update Profile
              </a>
            </div>
            <p>Need help? Contact our support team.</p>
            <p>Best regards,<br>TalentHive Team</p>
          </div>
        `,
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: `Verification ${action}d successfully`,
      data: {
        userId,
        badgeType,
        status: badge.status,
        reviewedAt: badge.reviewedAt
      }
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to review verification', 500));
  }
};

/**
 * Get verification statistics (Admin only)
 * GET /api/admin/verification/stats
 */
export const getVerificationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await User.aggregate([
      { $match: { role: 'freelancer' } },
      { $unwind: '$verificationBadges' },
      {
        $group: {
          _id: {
            type: '$verificationBadges.type',
            status: '$verificationBadges.status'
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format stats
    const formatted: any = {
      pending: { identity: 0, skills: 0, trusted: 0, total: 0 },
      approved: { identity: 0, skills: 0, trusted: 0, total: 0 },
      rejected: { identity: 0, skills: 0, trusted: 0, total: 0 }
    };
    
    stats.forEach(stat => {
      const { type, status } = stat._id;
      formatted[status][type] = stat.count;
      formatted[status].total += stat.count;
    });
    
    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get verification stats', 500));
  }
};

/**
 * Get freelancer verification details (Admin only)
 * GET /api/admin/verification/freelancer/:userId
 */
export const getFreelancerVerificationDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -passwordResetToken');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check qualifications for each badge type
    const qualifications = {
      identity: checkBadgeRequirements(user, 'identity'),
      skills: checkBadgeRequirements(user, 'skills'),
      trusted: {
        qualifies: user.qualifiesForTrustedBadge(),
        missing: user.qualifiesForTrustedBadge() ? [] : ['Does not meet performance criteria']
      }
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        freelancer: user,
        qualifications
      }
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get freelancer details', 500));
  }
};
