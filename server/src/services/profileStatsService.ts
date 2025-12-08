import { Types } from 'mongoose';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { Contract } from '@/models/Contract';
import { Review } from '@/models/Review';
import { Proposal } from '@/models/Proposal';

interface FreelancerStats {
  completionRate: number;
  averageRating: number;
  totalProjects: number;
  completedProjects: number;
  onTimeDelivery: number;
  responseTime: string;
  totalEarnings: number;
  activeContracts: number;
  profileViews: number;
  uniqueViewers: number;
}

interface ClientStats {
  totalProjectsPosted: number;
  activeContracts: number;
  completedProjects: number;
  averageProjectBudget: number;
  averageRating: number;
  totalSpent: number;
  profileViews: number;
  uniqueViewers: number;
}

interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export class ProfileStatsService {
  /**
   * Calculate freelancer statistics
   */
  static async getFreelancerStats(userId: string | Types.ObjectId): Promise<FreelancerStats> {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Get user data
    const user = await User.findById(objectId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all contracts for this freelancer
    const contracts = await Contract.find({ freelancerId: objectId });
    const completedContracts = contracts.filter(c => c.status === 'completed');
    const activeContracts = contracts.filter(c => 
      ['active', 'in-progress'].includes(c.status)
    );

    // Calculate completion rate
    const totalProjects = contracts.length;
    const completedProjects = completedContracts.length;
    const completionRate = totalProjects > 0 
      ? Math.round((completedProjects / totalProjects) * 100) 
      : 0;

    // Calculate on-time delivery
    const onTimeProjects = completedContracts.filter(c => {
      if (!c.endDate) return false;
      return new Date(c.endDate) <= new Date(c.endDate);
    }).length;
    const onTimeDelivery = completedProjects > 0
      ? Math.round((onTimeProjects / completedProjects) * 100)
      : 0;

    // Calculate average response time
    const proposals = await Proposal.find({ 
      freelancerId: objectId,
      createdAt: { $exists: true }
    }).limit(20);
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (const proposal of proposals) {
      const project = await Project.findById(proposal.project);
      if (project && project.createdAt && proposal.createdAt) {
        const diff = proposal.createdAt.getTime() - project.createdAt.getTime();
        totalResponseTime += diff;
        responseCount++;
      }
    }

    const avgResponseMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const responseTime = this.formatResponseTime(avgResponseMs);

    // Calculate total earnings
    const totalEarnings = completedContracts.reduce((sum, contract) => {
      return sum + (contract.totalAmount || 0);
    }, 0);

    // Get profile views
    const profileViews = user.profileViews || 0;
    const uniqueViewers = user.profileViewers?.length || 0;

    return {
      completionRate,
      averageRating: user.rating?.average || 0,
      totalProjects,
      completedProjects,
      onTimeDelivery,
      responseTime,
      totalEarnings,
      activeContracts: activeContracts.length,
      profileViews,
      uniqueViewers
    };
  }

  /**
   * Calculate client statistics
   */
  static async getClientStats(userId: string | Types.ObjectId): Promise<ClientStats> {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Get user data
    const user = await User.findById(objectId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all projects posted by this client
    const projects = await Project.find({ clientId: objectId });
    const totalProjectsPosted = projects.length;

    // Get all contracts for this client
    const contracts = await Contract.find({ clientId: objectId });
    const activeContracts = contracts.filter(c => 
      ['active', 'in-progress'].includes(c.status)
    );
    const completedContracts = contracts.filter(c => c.status === 'completed');

    // Calculate average project budget
    const totalBudget = projects.reduce((sum, project) => {
      return sum + (project.budget?.max || 0);
    }, 0);
    const averageProjectBudget = totalProjectsPosted > 0
      ? Math.round(totalBudget / totalProjectsPosted)
      : 0;

    // Calculate total spent
    const totalSpent = completedContracts.reduce((sum, contract) => {
      return sum + (contract.totalAmount || 0);
    }, 0);

    // Get profile views
    const profileViews = user.profileViews || 0;
    const uniqueViewers = user.profileViewers?.length || 0;

    return {
      totalProjectsPosted,
      activeContracts: activeContracts.length,
      completedProjects: completedContracts.length,
      averageProjectBudget,
      averageRating: user.rating?.average || 0,
      totalSpent,
      profileViews,
      uniqueViewers
    };
  }

  /**
   * Get rating distribution for a user
   */
  static async getRatingDistribution(userId: string | Types.ObjectId): Promise<RatingDistribution> {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const reviews = await Review.find({
      $or: [
        { freelancerId: objectId },
        { clientId: objectId }
      ]
    });

    const distribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach(review => {
      const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  }

  /**
   * Get completed projects with details for freelancer
   */
  static async getFreelancerProjects(userId: string | Types.ObjectId, limit = 10) {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const contracts = await Contract.find({
      freelancerId: objectId,
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .limit(limit)
      .populate('projectId', 'title description')
      .populate('clientId', 'profile.firstName profile.lastName profile.avatar');

    const projectsWithReviews = await Promise.all(
      contracts.map(async (contract) => {
        const review = await Review.findOne({
          contractId: contract._id,
          freelancerId: objectId
        });

        return {
          _id: contract._id,
          title: (contract.project as any)?.title || 'Untitled Project',
          description: (contract.project as any)?.description || '',
          client: {
            name: `${(contract.client as any)?.profile?.firstName || ''} ${(contract.client as any)?.profile?.lastName || ''}`.trim(),
            avatar: (contract.client as any)?.profile?.avatar
          },
          completedAt: contract.endDate,
          amount: contract.totalAmount,
          rating: review?.rating || null,
          review: review?.feedback || null
        };
      })
    );

    return projectsWithReviews;
  }

  /**
   * Get posted projects with details for client
   */
  static async getClientProjects(userId: string | Types.ObjectId, limit = 10) {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const projects = await Project.find({ clientId: objectId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const contract = await Contract.findOne({ projectId: project._id })
          .populate('freelancerId', 'profile.firstName profile.lastName profile.avatar');

        const review = contract ? await Review.findOne({
          contractId: contract._id,
          clientId: objectId
        }) : null;

        return {
          _id: project._id,
          title: project.title,
          description: project.description,
          status: project.status,
          budget: project.budget,
          freelancer: contract ? {
            name: `${(contract.freelancer as any)?.profile?.firstName || ''} ${(contract.freelancer as any)?.profile?.lastName || ''}`.trim(),
            avatar: (contract.freelancer as any)?.profile?.avatar
          } : null,
          createdAt: project.createdAt,
          rating: review?.rating || null
        };
      })
    );

    return projectsWithDetails;
  }

  /**
   * Track profile view
   */
  static async trackProfileView(profileUserId: string | Types.ObjectId, viewerId?: string | Types.ObjectId) {
    const profileObjectId = typeof profileUserId === 'string' 
      ? new Types.ObjectId(profileUserId) 
      : profileUserId;

    // Increment total views
    await User.findByIdAndUpdate(profileObjectId, {
      $inc: { profileViews: 1 }
    });

    // Track unique viewer if viewerId provided
    if (viewerId) {
      const viewerObjectId = typeof viewerId === 'string' 
        ? new Types.ObjectId(viewerId) 
        : viewerId;

      // Check if viewer already viewed this profile
      const user = await User.findById(profileObjectId);
      const alreadyViewed = user?.profileViewers?.some(
        v => v.viewerId.toString() === viewerObjectId.toString()
      );

      if (!alreadyViewed) {
        await User.findByIdAndUpdate(profileObjectId, {
          $push: {
            profileViewers: {
              viewerId: viewerObjectId,
              viewedAt: new Date()
            }
          }
        });
      } else {
        // Update last viewed time
        await User.updateOne(
          { 
            _id: profileObjectId,
            'profileViewers.viewerId': viewerObjectId
          },
          {
            $set: {
              'profileViewers.$.viewedAt': new Date()
            }
          }
        );
      }
    }
  }

  /**
   * Get profile viewers list
   */
  static async getProfileViewers(userId: string | Types.ObjectId, limit = 20) {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const user = await User.findById(objectId)
      .populate('profileViewers.viewerId', 'profile.firstName profile.lastName profile.avatar role');

    if (!user || !user.profileViewers) {
      return [];
    }

    return user.profileViewers
      .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime())
      .slice(0, limit)
      .map(viewer => ({
        user: viewer.viewerId,
        viewedAt: viewer.viewedAt
      }));
  }

  /**
   * Format response time in human-readable format
   */
  private static formatResponseTime(milliseconds: number): string {
    if (milliseconds === 0) return 'N/A';

    const hours = milliseconds / (1000 * 60 * 60);
    
    if (hours < 1) {
      const minutes = Math.round(milliseconds / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      const roundedHours = Math.round(hours);
      return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }
}
