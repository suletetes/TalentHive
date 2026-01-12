import { Response } from 'express';
import { User } from '@/models/User';
import { OnboardingAnalytics } from '@/models/OnboardingAnalytics';
import { AuthRequest } from '@/types/auth';

/**
 * Get user's onboarding status
 */
export const getOnboardingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get onboarding analytics if exists
    const analytics = await OnboardingAnalytics.findOne({ userId });

    const totalSteps = user.role === 'freelancer' ? 5 : user.role === 'client' ? 4 : 3;

    res.status(200).json({
      success: true,
      data: {
        onboardingCompleted: user.onboardingCompleted || false,
        currentStep: user.onboardingStep || 0,
        totalSteps,
        skippedAt: user.onboardingSkippedAt || null,
        analytics: analytics ? {
          startedAt: analytics.startedAt,
          stepsCompleted: analytics.stepsCompleted
        } : null
      }
    });
  } catch (error: any) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding status',
      error: error.message
    });
  }
};

/**
 * Update onboarding step
 */
export const updateOnboardingStep = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { step, stepName, timeSpent } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (typeof step !== 'number' || step < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's current step
    user.onboardingStep = step;
    await user.save();

    // Update or create onboarding analytics
    let analytics = await OnboardingAnalytics.findOne({ userId });

    if (!analytics) {
      // Create new analytics record
      analytics = new OnboardingAnalytics({
        userId,
        role: user.role,
        startedAt: new Date(),
        currentStep: step,
        totalSteps: user.role === 'freelancer' ? 5 : user.role === 'client' ? 4 : 3,
        stepsCompleted: []
      });
    }

    // Add completed step if provided
    if (stepName && timeSpent !== undefined) {
      const existingStep = analytics.stepsCompleted.find(s => s.stepNumber === step);
      if (!existingStep) {
        analytics.stepsCompleted.push({
          stepNumber: step,
          stepName,
          completedAt: new Date(),
          timeSpent
        });
      }
    }

    analytics.currentStep = step;
    await analytics.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding step updated',
      data: {
        currentStep: step,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error: any) {
    console.error('Update onboarding step error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update onboarding step',
      error: error.message
    });
  }
};

/**
 * Complete onboarding
 */
export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mark onboarding as completed
    user.onboardingCompleted = true;
    await user.save();

    // Update analytics
    const analytics = await OnboardingAnalytics.findOne({ userId });
    if (analytics) {
      analytics.completedAt = new Date();
      analytics.completionRate = 100;
      await analytics.save();
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        onboardingCompleted: true
      }
    });
  } catch (error: any) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: error.message
    });
  }
};

/**
 * Skip onboarding
 */
export const skipOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mark onboarding as skipped
    user.onboardingSkippedAt = new Date();
    await user.save();

    // Update analytics
    let analytics = await OnboardingAnalytics.findOne({ userId });
    if (!analytics) {
      analytics = new OnboardingAnalytics({
        userId,
        role: user.role,
        startedAt: new Date(),
        currentStep: user.onboardingStep || 0,
        totalSteps: user.role === 'freelancer' ? 5 : user.role === 'client' ? 4 : 3,
        stepsCompleted: []
      });
    }

    analytics.skippedAt = new Date();
    analytics.dropOffStep = user.onboardingStep || 0;
    await analytics.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding skipped',
      data: {
        skippedAt: user.onboardingSkippedAt
      }
    });
  } catch (error: any) {
    console.error('Skip onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip onboarding',
      error: error.message
    });
  }
};

/**
 * Get onboarding analytics (admin only)
 */
export const getOnboardingAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { role } = req.query;

    // Build query
    const query: any = {};
    if (role && ['admin', 'freelancer', 'client'].includes(role as string)) {
      query.role = role;
    }

    const analytics = await OnboardingAnalytics.find(query)
      .populate('userId', 'profile.firstName profile.lastName email')
      .sort({ startedAt: -1 });

    // Calculate aggregate statistics
    const totalUsers = analytics.length;
    const completedUsers = analytics.filter(a => a.completedAt).length;
    const skippedUsers = analytics.filter(a => a.skippedAt).length;
    const inProgressUsers = totalUsers - completedUsers - skippedUsers;

    const completionRate = totalUsers > 0 
      ? Math.round((completedUsers / totalUsers) * 100) 
      : 0;

    // Calculate average time to complete
    const completedAnalytics = analytics.filter(a => a.completedAt && a.startedAt);
    const avgTimeToComplete = completedAnalytics.length > 0
      ? completedAnalytics.reduce((sum, a) => {
          const time = a.completedAt!.getTime() - a.startedAt.getTime();
          return sum + time;
        }, 0) / completedAnalytics.length
      : 0;

    // Find most common drop-off step
    const dropOffSteps = analytics
      .filter(a => a.dropOffStep !== undefined && a.dropOffStep !== null)
      .map(a => a.dropOffStep);
    
    const dropOffCounts: { [key: number]: number } = {};
    dropOffSteps.forEach(step => {
      dropOffCounts[step] = (dropOffCounts[step] || 0) + 1;
    });

    const mostCommonDropOff = Object.entries(dropOffCounts)
      .sort(([, a], [, b]) => b - a)[0];

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          completedUsers,
          skippedUsers,
          inProgressUsers,
          completionRate,
          avgTimeToCompleteMs: Math.round(avgTimeToComplete),
          mostCommonDropOffStep: mostCommonDropOff ? {
            step: parseInt(mostCommonDropOff[0]),
            count: mostCommonDropOff[1]
          } : null
        },
        analytics
      }
    });
  } catch (error: any) {
    console.error('Get onboarding analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding analytics',
      error: error.message
    });
  }
};

/**
 * Get user's onboarding analytics
 */
export const getUserOnboardingAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify permission (user can view their own, admin can view any)
    if (req.user?._id?.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these analytics'
      });
    }

    const analytics = await OnboardingAnalytics.findOne({ userId })
      .populate('userId', 'profile.firstName profile.lastName email role');

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding analytics not found'
      });
    }

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Get user onboarding analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user onboarding analytics',
      error: error.message
    });
  }
};
