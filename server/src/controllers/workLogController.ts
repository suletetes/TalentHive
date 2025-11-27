import { Request, Response } from 'express';
import WorkLog from '@/models/WorkLog';
import { Contract } from '@/models/Contract';
import { logger } from '@/utils/logger';

// Create a new work log entry
export const createWorkLog = async (req: Request, res: Response) => {
  try {
    const { contractId, milestoneId, date, startTime, description } = req.body;
    const freelancerId = req.user?._id;

    if (!freelancerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!contractId || !date || !startTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Contract ID, date, and start time are required',
      });
    }

    // Verify contract belongs to freelancer and is active
    const contract = await Contract.findOne({
      _id: contractId,
      freelancer: freelancerId,
      status: 'active',
    });

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Active contract not found',
      });
    }

    // Check if contract is fully signed (both parties)
    const isFullySigned = contract.isFullySigned();
    if (!isFullySigned) {
      return res.status(400).json({
        status: 'error',
        message: 'Contract must be signed by both parties before logging work',
      });
    }

    // Validate milestone if provided
    if (milestoneId) {
      const milestoneExists = contract.milestones?.some(
        (m: any) => m._id.toString() === milestoneId
      );
      if (!milestoneExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid milestone ID',
        });
      }
    }

    const workLog = await WorkLog.create({
      freelancer: freelancerId,
      contract: contractId,
      milestone: milestoneId || undefined,
      date: new Date(date),
      startTime,
      description: description || '',
      status: 'in_progress',
    });

    const populated = await WorkLog.findById(workLog._id)
      .populate('contract', 'title milestones')
      .populate('freelancer', 'profile.firstName profile.lastName');

    res.status(201).json({
      status: 'success',
      data: { workLog: populated },
    });
  } catch (error) {
    logger.error('Error creating work log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create work log' });
  }
};

// Complete a work log entry (add end time)
export const completeWorkLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { endTime, description } = req.body;
    const freelancerId = req.user?._id;

    if (!freelancerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!endTime) {
      return res.status(400).json({
        status: 'error',
        message: 'End time is required',
      });
    }

    const workLog = await WorkLog.findOne({
      _id: id,
      freelancer: freelancerId,
      status: 'in_progress',
    });

    if (!workLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Work log not found or already completed',
      });
    }

    workLog.endTime = endTime;
    workLog.status = 'completed';
    if (description !== undefined) {
      workLog.description = description;
    }
    await workLog.save();

    const populated = await WorkLog.findById(workLog._id)
      .populate('contract', 'title')
      .populate('freelancer', 'profile.firstName profile.lastName');

    res.json({
      status: 'success',
      data: { workLog: populated },
    });
  } catch (error) {
    logger.error('Error completing work log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to complete work log' });
  }
};

// Update a work log entry
export const updateWorkLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, description } = req.body;
    const freelancerId = req.user?._id;

    if (!freelancerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const workLog = await WorkLog.findOne({
      _id: id,
      freelancer: freelancerId,
    });

    if (!workLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Work log not found',
      });
    }

    if (date) workLog.date = new Date(date);
    if (startTime) workLog.startTime = startTime;
    if (endTime) {
      workLog.endTime = endTime;
      workLog.status = 'completed';
    }
    if (description !== undefined) workLog.description = description;

    await workLog.save();

    const populated = await WorkLog.findById(workLog._id)
      .populate('contract', 'title')
      .populate('freelancer', 'profile.firstName profile.lastName');

    res.json({
      status: 'success',
      data: { workLog: populated },
    });
  } catch (error) {
    logger.error('Error updating work log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update work log' });
  }
};

// Delete a work log entry
export const deleteWorkLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user?._id;

    if (!freelancerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const workLog = await WorkLog.findOneAndDelete({
      _id: id,
      freelancer: freelancerId,
    });

    if (!workLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Work log not found',
      });
    }

    res.json({
      status: 'success',
      message: 'Work log deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting work log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete work log' });
  }
};

// Get work logs (freelancer sees own, client sees their freelancers')
export const getWorkLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { contractId, startDate, endDate, status, page = 1, limit = 10, groupByContract } = req.query;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const query: any = {};

    if (userRole === 'freelancer') {
      query.freelancer = userId;
    } else if (userRole === 'client') {
      const contracts = await Contract.find({ client: userId }).select('_id');
      query.contract = { $in: contracts.map((c) => c._id) };
    }

    if (contractId) query.contract = contractId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await WorkLog.countDocuments(query);
    const workLogs = await WorkLog.find(query)
      .populate('contract', 'title')
      .populate('freelancer', 'profile.firstName profile.lastName')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limitNum);

    // Group by contract for clients if requested
    let grouped = null;
    if (groupByContract === 'true' && userRole === 'client') {
      const allLogs = await WorkLog.find(query)
        .populate('contract', 'title')
        .populate('freelancer', 'profile.firstName profile.lastName')
        .sort({ date: -1 });

      const contractMap = new Map<string, any>();
      allLogs.forEach((log: any) => {
        const contractId = log.contract?._id?.toString() || 'unknown';
        if (!contractMap.has(contractId)) {
          contractMap.set(contractId, {
            contract: log.contract,
            logs: [],
            totalMinutes: 0,
            totalHours: 0,
          });
        }
        const group = contractMap.get(contractId);
        group.logs.push(log);
        group.totalMinutes += log.duration || 0;
        group.totalHours = Math.round((group.totalMinutes / 60) * 100) / 100;
      });
      grouped = Array.from(contractMap.values());
    }

    res.json({
      status: 'success',
      results: workLogs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: { workLogs, grouped },
    });
  } catch (error) {
    logger.error('Error fetching work logs:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch work logs' });
  }
};

// Get work log summary/report
export const getWorkLogReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { contractId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const query: any = { status: 'completed' };

    if (userRole === 'freelancer') {
      query.freelancer = userId;
    } else if (userRole === 'client') {
      const contracts = await Contract.find({ client: userId }).select('_id');
      query.contract = { $in: contracts.map((c) => c._id) };
    }

    if (contractId) query.contract = contractId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const workLogs = await WorkLog.find(query)
      .populate('contract', 'title')
      .populate('freelancer', 'profile.firstName profile.lastName')
      .sort({ date: -1 });

    const totalMinutes = workLogs.reduce((sum, log) => sum + log.duration, 0);
    const totalHours = totalMinutes / 60;

    res.json({
      status: 'success',
      data: {
        report: {
          totalEntries: workLogs.length,
          totalMinutes,
          totalHours: Math.round(totalHours * 100) / 100,
          workLogs,
        },
      },
    });
  } catch (error) {
    logger.error('Error generating work log report:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate report' });
  }
};
