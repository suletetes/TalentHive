import { Request, Response } from 'express';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Transaction } from '../models/Transaction';
import { Contract } from '../models/Contract';
import { Proposal } from '../models/Proposal';
import { AuthRequest } from '../middleware/auth';

export const analyticsController = {
  // Get revenue analytics
  getRevenueAnalytics: async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const matchStage: any = {
        status: { $in: ['released', 'held_in_escrow'] },
      };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
      }

      // Determine grouping format
      let dateFormat: any;
      switch (groupBy) {
        case 'hour':
          dateFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
          break;
        case 'day':
          dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case 'week':
          dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
          break;
        case 'month':
          dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        case 'year':
          dateFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
          break;
        default:
          dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const revenueData = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: dateFormat,
            totalRevenue: { $sum: '$amount' },
            platformCommission: { $sum: '$platformCommission' },
            processingFees: { $sum: '$processingFee' },
            tax: { $sum: '$tax' },
            freelancerPayouts: { $sum: '$freelancerAmount' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get total statistics
      const totalStats = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalCommission: { $sum: '$platformCommission' },
            totalProcessingFees: { $sum: '$processingFee' },
            totalTax: { $sum: '$tax' },
            totalPayouts: { $sum: '$freelancerAmount' },
            totalTransactions: { $sum: 1 },
          },
        },
      ]);

      res.json({
        status: 'success',
        data: {
          timeline: revenueData,
          totals: totalStats[0] || {
            totalRevenue: 0,
            totalCommission: 0,
            totalProcessingFees: 0,
            totalTax: 0,
            totalPayouts: 0,
            totalTransactions: 0,
          },
        },
      });
    } catch (error: any) {
      console.error('Get revenue analytics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get revenue analytics',
        error: error.message,
      });
    }
  },

  // Get user growth analytics
  getUserGrowthAnalytics: async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const matchStage: any = {};

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
      }

      // Determine grouping format
      let dateFormat: any;
      switch (groupBy) {
        case 'day':
          dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case 'week':
          dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
          break;
        case 'month':
          dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        case 'year':
          dateFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
          break;
        default:
          dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const userGrowth = await User.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              date: dateFormat,
              role: '$role',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]);

      // Transform data for easier consumption
      const timeline: any = {};
      userGrowth.forEach((item) => {
        const date = item._id.date;
        if (!timeline[date]) {
          timeline[date] = { date, freelancers: 0, clients: 0, admins: 0, total: 0 };
        }
        timeline[date][item._id.role + 's'] = item.count;
        timeline[date].total += item.count;
      });

      // Get total user counts
      const [totalFreelancers, totalClients, totalAdmins] = await Promise.all([
        User.countDocuments({ role: 'freelancer' }),
        User.countDocuments({ role: 'client' }),
        User.countDocuments({ role: 'admin' }),
      ]);

      res.json({
        status: 'success',
        data: {
          timeline: Object.values(timeline),
          totals: {
            freelancers: totalFreelancers,
            clients: totalClients,
            admins: totalAdmins,
            total: totalFreelancers + totalClients + totalAdmins,
          },
        },
      });
    } catch (error: any) {
      console.error('Get user growth analytics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user growth analytics',
        error: error.message,
      });
    }
  },

  // Get project statistics
  getProjectStats: async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const matchStage: any = {};

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
      }

      // Project status distribution
      const statusDistribution = await Project.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      // Projects by category - category is stored as a String directly
      const categoryDistribution = await Project.aggregate([
        { $match: { ...matchStage, category: { $exists: true, $nin: [null, ''] } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $match: { _id: { $nin: [null, ''] } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // Budget range distribution
      const budgetDistribution = await Project.aggregate([
        { $match: matchStage },
        {
          $bucket: {
            groupBy: '$budget.max',
            boundaries: [0, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000],
            default: '100000+',
            output: {
              count: { $sum: 1 },
              avgBudget: { $avg: '$budget.max' },
            },
          },
        },
      ]);

      // Total statistics
      const [totalProjects, activeProjects, completedProjects] = await Promise.all([
        Project.countDocuments(matchStage),
        Project.countDocuments({ ...matchStage, status: 'in_progress' }),
        Project.countDocuments({ ...matchStage, status: 'completed' }),
      ]);

      res.json({
        status: 'success',
        data: {
          statusDistribution,
          categoryDistribution,
          budgetDistribution,
          totals: {
            total: totalProjects,
            active: activeProjects,
            completed: completedProjects,
          },
        },
      });
    } catch (error: any) {
      console.error('Get project stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get project statistics',
        error: error.message,
      });
    }
  },

  // Get payment analytics
  getPaymentAnalytics: async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const matchStage: any = {};

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
      }

      // Payment status distribution
      const statusDistribution = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]);

      // Average transaction value
      const avgTransactionValue = await Transaction.aggregate([
        { $match: { ...matchStage, status: { $in: ['released', 'held_in_escrow'] } } },
        {
          $group: {
            _id: null,
            avgAmount: { $avg: '$amount' },
            avgCommission: { $avg: '$platformCommission' },
          },
        },
      ]);

      // Payment method distribution
      const paymentMethodDistribution = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]);

      res.json({
        status: 'success',
        data: {
          statusDistribution,
          paymentMethodDistribution,
          averages: avgTransactionValue[0] || { avgAmount: 0, avgCommission: 0 },
        },
      });
    } catch (error: any) {
      console.error('Get payment analytics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get payment analytics',
        error: error.message,
      });
    }
  },

  // Get dashboard overview
  getDashboardOverview: async (req: AuthRequest, res: Response) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        totalProjects,
        totalContracts,
        totalRevenue,
        recentUsers,
        recentProjects,
        activeContracts,
        pendingProposals,
      ] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        Contract.countDocuments(),
        Transaction.aggregate([
          { $match: { status: { $in: ['released', 'held_in_escrow'] } } },
          { $group: { _id: null, total: { $sum: '$platformCommission' } } },
        ]),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Project.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Contract.countDocuments({ status: 'active' }),
        Proposal.countDocuments({ status: 'submitted' }),
      ]);

      res.json({
        status: 'success',
        data: {
          users: {
            total: totalUsers,
            recent: recentUsers,
          },
          projects: {
            total: totalProjects,
            recent: recentProjects,
          },
          contracts: {
            total: totalContracts,
            active: activeContracts,
          },
          revenue: {
            total: totalRevenue[0]?.total || 0,
          },
          proposals: {
            pending: pendingProposals,
          },
        },
      });
    } catch (error: any) {
      console.error('Get dashboard overview error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get dashboard overview',
        error: error.message,
      });
    }
  },
};
