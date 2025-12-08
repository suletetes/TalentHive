import { Request, Response } from 'express';
import { User } from '@/models/User';
import { ProfileStatsService } from '@/services/profileStatsService';
import { AuthRequest } from '@/types/auth';

/**
 * Get freelancer profile with stats, projects, and ratings
 */
export const getFreelancerProfile = async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;

    // Find user by slug or ID
    let user;
    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      user = await User.findById(slugOrId);
    } else {
      // It's a slug
      user = await User.findOne({ profileSlug: slugOrId.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found'
      });
    }

    if (user.role !== 'freelancer') {
      return res.status(400).json({
        success: false,
        message: 'User is not a freelancer'
      });
    }

    // Track profile view if viewer is authenticated
    const authReq = req as AuthRequest;
    if (authReq.user && authReq.user.userId !== user._id.toString()) {
      await ProfileStatsService.trackProfileView(user._id, authReq.user.userId);
    } else if (!authReq.user) {
      // Track anonymous view
      await ProfileStatsService.trackProfileView(user._id);
    }

    // Get statistics
    const stats = await ProfileStatsService.getFreelancerStats(user._id);

    // Get rating distribution
    const ratingDistribution = await ProfileStatsService.getRatingDistribution(user._id);

    // Get completed projects
    const projects = await ProfileStatsService.getFreelancerProjects(user._id, 10);

    // Prepare user data (exclude sensitive fields)
    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      freelancerProfile: user.freelancerProfile,
      rating: user.rating,
      profileSlug: user.profileSlug,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        stats,
        ratingDistribution,
        projects
      }
    });
  } catch (error: any) {
    console.error('Get freelancer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get freelancer profile',
      error: error.message
    });
  }
};

/**
 * Get client profile with stats, projects, and ratings
 */
export const getClientProfile = async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;

    // Find user by slug or ID
    let user;
    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      user = await User.findById(slugOrId);
    } else {
      // It's a slug
      user = await User.findOne({ profileSlug: slugOrId.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (user.role !== 'client') {
      return res.status(400).json({
        success: false,
        message: 'User is not a client'
      });
    }

    // Track profile view if viewer is authenticated
    const authReq = req as AuthRequest;
    if (authReq.user && authReq.user.userId !== user._id.toString()) {
      await ProfileStatsService.trackProfileView(user._id, authReq.user.userId);
    } else if (!authReq.user) {
      // Track anonymous view
      await ProfileStatsService.trackProfileView(user._id);
    }

    // Get statistics
    const stats = await ProfileStatsService.getClientStats(user._id);

    // Get rating distribution
    const ratingDistribution = await ProfileStatsService.getRatingDistribution(user._id);

    // Get posted projects
    const projects = await ProfileStatsService.getClientProjects(user._id, 10);

    // Prepare user data (exclude sensitive fields)
    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      clientProfile: user.clientProfile,
      rating: user.rating,
      profileSlug: user.profileSlug,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        stats,
        ratingDistribution,
        projects
      }
    });
  } catch (error: any) {
    console.error('Get client profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client profile',
      error: error.message
    });
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let stats;
    if (user.role === 'freelancer') {
      stats = await ProfileStatsService.getFreelancerStats(userId);
    } else if (user.role === 'client') {
      stats = await ProfileStatsService.getClientStats(userId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Statistics not available for this user role'
      });
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message
    });
  }
};

/**
 * Track profile view
 */
export const trackProfileView = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?._id;

    await ProfileStatsService.trackProfileView(userId, viewerId);

    res.status(200).json({
      success: true,
      message: 'Profile view tracked'
    });
  } catch (error: any) {
    console.error('Track profile view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track profile view',
      error: error.message
    });
  }
};

/**
 * Get profile view analytics
 */
export const getProfileViewAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists and requester has permission
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow users to view their own analytics or admins
    if (req.user?._id?.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these analytics'
      });
    }

    const analytics = {
      totalViews: user.profileViews || 0,
      uniqueViewers: user.profileViewers?.length || 0,
      recentViewers: await ProfileStatsService.getProfileViewers(userId, 10)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Get profile view analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile view analytics',
      error: error.message
    });
  }
};

/**
 * Get profile viewers list
 */
export const getProfileViewers = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    // Verify user exists and requester has permission
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow users to view their own viewers or admins
    if (req.user?._id?.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this information'
      });
    }

    const viewers = await ProfileStatsService.getProfileViewers(userId, limit);

    res.status(200).json({
      success: true,
      data: viewers
    });
  } catch (error: any) {
    console.error('Get profile viewers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile viewers',
      error: error.message
    });
  }
};
