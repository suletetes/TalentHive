import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { Contract } from '@/models/Contract';
import { Payment } from '@/models/Payment';
import { Category } from '@/models/Category';
import { logger } from '@/utils/logger';

interface ChartDataPoint {
  date: string;
  count: number;
}

interface RevenueData {
  total: number;
  byCategory: Array<{
    category: string;
    amount: number;
  }>;
  trend: ChartDataPoint[];
}

interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  completionRate: number;
  averageTimeline: number;
}

interface TopUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  metric: number;
}

interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

class AnalyticsService {
  /**
   * Get user growth data over time
   */
  async getUserGrowth(startDate: Date, endDate: Date): Promise<ChartDataPoint[]> {
    try {
      const users = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1
          }
        }
      ]);

      return users;
    } catch (error: any) {
      logger.error('Error getting user growth:', error);
      throw new Error('Failed to fetch user growth data');
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueData> {
    try {
      // Get total revenue
      const totalResult = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      // Get revenue by category
      const byCategory = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $lookup: {
            from: 'contracts',
            localField: 'contract',
            foreignField: '_id',
            as: 'contractData'
          }
        },
        {
          $unwind: '$contractData'
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'contractData.project',
            foreignField: '_id',
            as: 'projectData'
          }
        },
        {
          $unwind: '$projectData'
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'projectData.category',
            foreignField: '_id',
            as: 'categoryData'
          }
        },
        {
          $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true }
        },
        {
          $group: {
            _id: '$categoryData.name',
            amount: { $sum: '$amount' }
          }
        },
        {
          $project: {
            _id: 0,
            category: { $ifNull: ['$_id', 'Uncategorized'] },
            amount: 1
          }
        },
        {
          $sort: { amount: -1 }
        }
      ]);

      // Get revenue trend
      const trend = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: '$amount' }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1
          }
        }
      ]);

      return {
        total,
        byCategory,
        trend
      };
    } catch (error: any) {
      logger.error('Error getting revenue metrics:', error);
      throw new Error('Failed to fetch revenue metrics');
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<ProjectStats> {
    try {
      const stats = await Project.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          completed: 0,
          inProgress: 0,
          completionRate: 0,
          averageTimeline: 0
        };
      }

      const { total, completed, inProgress } = stats[0];
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Calculate average timeline for completed projects
      const timelineResult = await Project.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $exists: true },
            updatedAt: { $exists: true }
          }
        },
        {
          $project: {
            duration: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averageTimeline: { $avg: '$duration' }
          }
        }
      ]);

      const averageTimeline = timelineResult.length > 0 ? Math.round(timelineResult[0].averageTimeline) : 0;

      return {
        total,
        completed,
        inProgress,
        completionRate: Math.round(completionRate * 10) / 10,
        averageTimeline
      };
    } catch (error: any) {
      logger.error('Error getting project stats:', error);
      throw new Error('Failed to fetch project statistics');
    }
  }

  /**
   * Get top freelancers by activity
   */
  async getTopFreelancers(limit: number = 10): Promise<TopUser[]> {
    try {
      const topFreelancers = await Contract.aggregate([
        {
          $match: {
            status: { $in: ['active', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$freelancer',
            metric: { $sum: 1 }
          }
        },
        {
          $sort: { metric: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userData'
          }
        },
        {
          $unwind: '$userData'
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            name: '$userData.name',
            email: '$userData.email',
            avatar: '$userData.avatar',
            metric: 1
          }
        }
      ]);

      return topFreelancers;
    } catch (error: any) {
      logger.error('Error getting top freelancers:', error);
      throw new Error('Failed to fetch top freelancers');
    }
  }

  /**
   * Get top clients by activity
   */
  async getTopClients(limit: number = 10): Promise<TopUser[]> {
    try {
      const topClients = await Project.aggregate([
        {
          $match: {
            status: { $ne: 'draft' }
          }
        },
        {
          $group: {
            _id: '$client',
            metric: { $sum: 1 }
          }
        },
        {
          $sort: { metric: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userData'
          }
        },
        {
          $unwind: '$userData'
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            name: '$userData.name',
            email: '$userData.email',
            avatar: '$userData.avatar',
            metric: 1
          }
        }
      ]);

      return topClients;
    } catch (error: any) {
      logger.error('Error getting top clients:', error);
      throw new Error('Failed to fetch top clients');
    }
  }

  /**
   * Get category distribution
   */
  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    try {
      const distribution = await Project.aggregate([
        {
          $match: {
            status: { $ne: 'draft' }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryData'
          }
        },
        {
          $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true }
        },
        {
          $group: {
            _id: '$categoryData.name',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            category: { $ifNull: ['$_id', 'Uncategorized'] },
            count: 1
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Calculate percentages
      const total = distribution.reduce((sum, item) => sum + item.count, 0);
      const withPercentages = distribution.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 100 * 10) / 10 : 0
      }));

      return withPercentages;
    } catch (error: any) {
      logger.error('Error getting category distribution:', error);
      throw new Error('Failed to fetch category distribution');
    }
  }
}

export const analyticsService = new AnalyticsService();
