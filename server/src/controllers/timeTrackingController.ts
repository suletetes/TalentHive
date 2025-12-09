import { Request, Response } from 'express';
import TimeEntry from '@/models/TimeEntry';
import WorkSession from '@/models/WorkSession';
import { Contract } from '@/models/Contract';
import { logger } from '@/utils/logger';

// Get active work session
export const getActiveSession = async (req: Request, res: Response) => {
  try {
    const freelancerId = req.user?._id;
    const userRole = req.user?.role;
    
    if (!freelancerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const session = await WorkSession.findOne({
      freelancer: freelancerId,
      status: 'active',
    })
      .populate('project', 'title')
      .populate('contract', 'title');

    console.log('[TIME TRACKING] getActiveSession result:', {
      found: !!session,
      sessionId: session?._id?.toString(),
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'No active session found',
      });
    }

    res.json({
      status: 'success',
      data: { session },
    });
  } catch (error) {
    console.error('[TIME TRACKING] getActiveSession error:', error);
    logger.error('Error getting active session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get active session',
    });
  }
};

// Start a new work session
export const startWorkSession = async (req: Request, res: Response) => {
  try {
    const { contractId } = req.body;
    const freelancerId = req.user?._id;
    const userRole = req.user?.role;
    
    console.log('[TIME TRACKING] ========== START SESSION REQUEST ==========');
    console.log('[TIME TRACKING] Request body:', JSON.stringify(req.body));
    console.log('[TIME TRACKING] User info:', { 
      freelancerId: freelancerId?.toString(), 
      userRole,
      hasUser: !!req.user,
      userName: req.user?.profile?.firstName + ' ' + req.user?.profile?.lastName,
    });
    
    if (!freelancerId) {
      console.log('[TIME TRACKING] REJECTED: No freelancerId - unauthorized');
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    if (!contractId) {
      console.log('[TIME TRACKING] REJECTED: No contractId provided in request body');
      return res.status(400).json({
        status: 'error',
        message: 'Contract ID is required',
      });
    }

    // Check if there's an active session
    const activeSession = await WorkSession.findOne({
      freelancer: freelancerId,
      status: 'active',
    });

    if (activeSession) {
      console.log('[TIME TRACKING] Already has active session:', activeSession._id);
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active work session',
      });
    }

    // First check if contract exists at all
    const contractExists = await Contract.findById(contractId);
    console.log('[TIME TRACKING] Contract lookup:', { 
      exists: !!contractExists, 
      status: contractExists?.status,
      freelancer: contractExists?.freelancer?.toString(),
      expectedFreelancer: freelancerId.toString()
    });

    // Verify contract exists and belongs to freelancer
    const contract = await Contract.findOne({
      _id: contractId,
      freelancer: freelancerId,
      status: 'active',
    });

    if (!contract) {
      // Provide more specific error message
      if (!contractExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Contract not found',
        });
      }
      if (contractExists.freelancer?.toString() !== freelancerId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'This contract does not belong to you',
        });
      }
      if (contractExists.status !== 'active') {
        return res.status(400).json({
          status: 'error',
          message: `Contract is not active (current status: ${contractExists.status})`,
        });
      }
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found or not active',
      });
    }

    // Extract projectId from the contract
    const projectId = contract.project;

    // Create new work session
    const session = await WorkSession.create({
      freelancer: freelancerId,
      project: projectId,
      contract: contractId,
      startTime: new Date(),
      status: 'active',
    });

    res.status(201).json({
      status: 'success',
      data: { session },
    });
  } catch (error) {
    logger.error('Error starting work session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start work session',
    });
  }
};

// Stop active work session
export const stopWorkSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const freelancerId = req.user?._id;
    if (!freelancerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const session = await WorkSession.findOne({
      _id: sessionId,
      freelancer: freelancerId,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Active work session not found',
      });
    }

    session.endTime = new Date();
    session.status = 'completed';
    await session.save();

    res.json({
      status: 'success',
      data: { session },
    });
  } catch (error) {
    logger.error('Error stopping work session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to stop work session',
    });
  }
};

// Create a time entry
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const { contractId, milestoneId, description, duration, hourlyRate } = req.body;
    const freelancerId = req.user?._id;
    if (!freelancerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    if (!contractId) {
      return res.status(400).json({
        status: 'error',
        message: 'Contract ID is required',
      });
    }

    // Verify contract and get project from it
    const contract = await Contract.findOne({
      _id: contractId,
      freelancer: freelancerId,
    });

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found',
      });
    }

    // Extract projectId from contract
    const projectId = contract.project;

    const timeEntry = await TimeEntry.create({
      freelancer: freelancerId,
      project: projectId,
      contract: contractId,
      milestone: milestoneId,
      startTime: new Date(),
      duration: duration || 0,
      description,
      hourlyRate: hourlyRate || 0,
      status: 'stopped',
    });

    res.status(201).json({
      status: 'success',
      data: { timeEntry },
    });
  } catch (error) {
    logger.error('Error creating time entry:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create time entry',
    });
  }
};

// Update time entry
export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const { description, duration, activityLevel } = req.body;
    const freelancerId = req.user?._id;
    if (!freelancerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const timeEntry = await TimeEntry.findOne({
      _id: entryId,
      freelancer: freelancerId,
      status: { $in: ['active', 'paused', 'stopped'] },
    });

    if (!timeEntry) {
      return res.status(404).json({
        status: 'error',
        message: 'Time entry not found or cannot be updated',
      });
    }

    if (description) timeEntry.description = description;
    if (duration !== undefined) timeEntry.duration = duration;
    if (activityLevel !== undefined) timeEntry.activityLevel = activityLevel;

    await timeEntry.save();

    res.json({
      status: 'success',
      data: { timeEntry },
    });
  } catch (error) {
    logger.error('Error updating time entry:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update time entry',
    });
  }
};

// Submit time entries for approval
export const submitTimeEntries = async (req: Request, res: Response) => {
  try {
    const { entryIds } = req.body;
    const freelancerId = req.user?._id;
    if (!freelancerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const result = await TimeEntry.updateMany(
      {
        _id: { $in: entryIds },
        freelancer: freelancerId,
        status: 'stopped',
      },
      {
        $set: {
          status: 'submitted',
          submittedAt: new Date(),
        },
      }
    );

    res.json({
      status: 'success',
      message: `${result.modifiedCount} time entries submitted for approval`,
    });
  } catch (error) {
    logger.error('Error submitting time entries:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit time entries',
    });
  }
};

// Approve or reject time entry (client)
export const reviewTimeEntry = async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const { status, reviewNotes } = req.body;
    const clientId = req.user?._id;
    if (!clientId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be approved or rejected',
      });
    }

    const timeEntry = await TimeEntry.findOne({
      _id: entryId,
      status: 'submitted',
    }).populate('contract');

    if (!timeEntry) {
      return res.status(404).json({
        status: 'error',
        message: 'Time entry not found or not submitted',
      });
    }

    // Verify client owns the contract
    const contract = timeEntry.contract as any;
    if (contract.client.toString() !== clientId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to review this time entry',
      });
    }

    timeEntry.status = status;
    timeEntry.reviewedAt = new Date();
    timeEntry.reviewedBy = clientId as any;
    timeEntry.reviewNotes = reviewNotes;

    await timeEntry.save();

    res.json({
      status: 'success',
      data: { timeEntry },
    });
  } catch (error) {
    logger.error('Error reviewing time entry:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to review time entry',
    });
  }
};

// Get time entries
export const getTimeEntries = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { projectId, contractId, status, startDate, endDate } = req.query;

    console.log(`[TIME TRACKING] Fetching entries for user: ${userId}, role: ${req.user.role}`);

    const query: any = {};

    // Filter by role
    if (req.user.role === 'freelancer') {
      query.freelancer = userId;
      console.log(`[TIME TRACKING] Filtering by freelancer: ${userId}`);
    } else if (req.user.role === 'client') {
      // Get contracts where user is client
      const contracts = await Contract.find({ client: userId }).select('_id');
      console.log(`[TIME TRACKING] Found ${contracts.length} contracts for client`);
      query.contract = { $in: contracts.map(c => c._id) };
    }

    if (projectId) query.project = projectId;
    if (contractId) query.contract = contractId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate as string);
      if (endDate) query.startTime.$lte = new Date(endDate as string);
    }

    console.log(`[TIME TRACKING] Query:`, query);

    const timeEntries = await TimeEntry.find(query)
      .populate('freelancer', 'firstName lastName profilePicture')
      .populate('project', 'title')
      .populate('contract', 'title')
      .sort({ startTime: -1 });

    console.log(`[TIME TRACKING] Found ${timeEntries.length} time entries`);

    res.json({
      status: 'success',
      results: timeEntries.length,
      data: { timeEntries },
    });
  } catch (error) {
    console.error('[TIME TRACKING ERROR]', error);
    logger.error('Error fetching time entries:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch time entries',
    });
  }
};

// Get time report
export const getTimeReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { projectId, contractId, startDate, endDate } = req.query;

    const query: any = {
      status: 'approved',
    };

    if (req.user.role === 'freelancer') {
      query.freelancer = userId;
    } else if (req.user.role === 'client') {
      const contracts = await Contract.find({ client: userId }).select('_id');
      query.contract = { $in: contracts.map(c => c._id) };
    }

    if (projectId) query.project = projectId;
    if (contractId) query.contract = contractId;

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate as string);
      if (endDate) query.startTime.$lte = new Date(endDate as string);
    }

    const entries = await TimeEntry.find(query)
      .populate('freelancer', 'firstName lastName')
      .populate('project', 'title')
      .populate('contract', 'title');

    const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalAmount = entries.reduce((sum, entry) => sum + (entry.billableAmount || 0), 0);

    const report = {
      startDate: startDate || entries[0]?.startTime,
      endDate: endDate || entries[entries.length - 1]?.startTime,
      totalHours: totalDuration / 3600,
      totalAmount,
      entriesCount: entries.length,
      entries,
    };

    res.json({
      status: 'success',
      data: { report },
    });
  } catch (error) {
    logger.error('Error generating time report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate time report',
    });
  }
};
