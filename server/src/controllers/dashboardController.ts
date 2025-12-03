import { Request, Response } from 'express';
import { Project } from '@/models/Project';
import { Proposal } from '@/models/Proposal';
import { Contract } from '@/models/Contract';
import { Transaction } from '@/models/Transaction';
import { catchAsync } from '@/middleware/errorHandler';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: any;
}

// Get user's project stats for dashboard
export const getMyProjectStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  const userRole = req.user?.role;
  
  console.log('📊 [MY_STATS] Getting stats for user:', userId, 'Role:', userRole);

  if (userRole === 'freelancer') {
    // Freelancer stats
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalProposals, activeContracts, earnings] = await Promise.all([
      Proposal.countDocuments({ freelancer: userId }),
      Contract.countDocuments({ freelancer: userId, status: 'active' }),
      Transaction.aggregate([
        { $match: { freelancer: userObjectId, status: { $in: ['released', 'paid_out', 'held_in_escrow'] } } },
        { $group: { _id: null, total: { $sum: '$freelancerAmount' } } },
      ]),
    ]);

    const totalEarnings = earnings[0]?.total || 0;
    
    console.log('📊 [MY_STATS] Freelancer stats:', {
      totalProposals,
      activeProjects: activeContracts,
      totalEarnings,
    });

    return res.json({
      status: 'success',
      data: {
        totalProposals,
        activeProjects: activeContracts,
        totalEarnings,
      },
    });
  }

  if (userRole === 'client') {
    // Client stats
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all client's projects
    const clientProjects = await Project.find({ client: userId }).select('_id');
    const projectIds = clientProjects.map(p => p._id);

    const [totalProjects, activeProjects, receivedProposals, ongoingContracts, spent] = await Promise.all([
      Project.countDocuments({ client: userId }),
      Project.countDocuments({ client: userId, status: 'in_progress' }),
      Proposal.countDocuments({ project: { $in: projectIds } }),
      Contract.countDocuments({ client: userId, status: 'active' }),
      Transaction.aggregate([
        { $match: { client: userObjectId, status: { $in: ['completed', 'released', 'held_in_escrow'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalSpent = spent[0]?.total || 0;
    
    console.log('📊 [MY_STATS] Client stats:', {
      totalProjects,
      activeProjects,
      receivedProposals,
      ongoingContracts,
      totalSpent,
    });

    return res.json({
      status: 'success',
      data: {
        totalProjects,
        activeProjects,
        receivedProposals,
        ongoingContracts,
        totalSpent,
      },
    });
  }

  // Default empty stats
  return res.json({
    status: 'success',
    data: {},
  });
});
