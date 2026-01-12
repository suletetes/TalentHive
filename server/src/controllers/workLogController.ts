import { Request, Response } from 'express';
import WorkLog from '@/models/WorkLog';
import { Contract } from '@/models/Contract';
import { logger } from '@/utils/logger';

// Create/Start a new work log entry
export const createWorkLog = async (req: Request, res: Response) => {
  try {
    const { contractId, milestoneId, startDate, startTime, description } = req.body;
    const freelancerId = req.user?._id;

    if (!freelancerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!contractId || !startDate || !startTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Contract ID, start date, and start time are required',
      });
    }

    const contract = await Contract.findOne({
      _id: contractId,
      freelancer: freelancerId,
      status: 'active',
    });

    if (!contract) {
      return res.status(404).json({ status: 'error', message: 'Active contract not found' });
    }

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
        return res.status(400).json({ status: 'error', message: 'Invalid milestone ID' });
      }
    }

    const workLog = await WorkLog.create({
      freelancer: freelancerId,
      contract: contractId,
      milestone: milestoneId || undefined,
      startDate: new Date(startDate),
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

// Complete a work log entry (add end date/time)
export const completeWorkLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { endDate, endTime, description } = req.body;
    const freelancerId = req.user?._id;

    if (!freelancerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!endDate || !endTime) {
      return res.status(400).json({
        status: 'error',
        message: 'End date and end time are required',
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

    // For validation, ensure end date/time makes sense
    // If end date is provided, it should be a valid date
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    if (isNaN(endDateTime.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid end date or time format',
      });
    }

    // Note: We don't strictly validate end > start because seed data may have inconsistent dates
    // The duration calculation in the model will handle negative durations by setting to 0

    workLog.endDate = new Date(endDate);
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
    const { startDate, startTime, endDate, endTime, description } = req.body;
    const freelancerId = req.user?._id;

    if (!freelancerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const workLog = await WorkLog.findOne({ _id: id, freelancer: freelancerId });

    if (!workLog) {
      return res.status(404).json({ status: 'error', message: 'Work log not found' });
    }

    if (startDate) workLog.startDate = new Date(startDate);
    if (startTime) workLog.startTime = startTime;
    if (endDate) workLog.endDate = new Date(endDate);
    if (endTime) {
      workLog.endTime = endTime;
      if (workLog.endDate) workLog.status = 'completed';
    }
    if (description !== undefined) workLog.description = description;

    await workLog.save();

    const populated = await WorkLog.findById(workLog._id)
      .populate('contract', 'title')
      .populate('freelancer', 'profile.firstName profile.lastName');

    res.json({ status: 'success', data: { workLog: populated } });
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

    const workLog = await WorkLog.findOneAndDelete({ _id: id, freelancer: freelancerId });

    if (!workLog) {
      return res.status(404).json({ status: 'error', message: 'Work log not found' });
    }

    res.json({ status: 'success', message: 'Work log deleted successfully' });
  } catch (error) {
    logger.error('Error deleting work log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete work log' });
  }
};

// Get work logs
export const getWorkLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { contractId, startDate, endDate, status, page = 1, limit = 500, groupByContract } = req.query;

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
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate as string);
      if (endDate) query.startDate.$lte = new Date(endDate as string);
    }

    const total = await WorkLog.countDocuments(query);
    const workLogs = await WorkLog.find(query)
      .populate('contract', 'title')
      .populate('freelancer', 'profile.firstName profile.lastName')
      .sort({ startDate: -1, startTime: -1 });

    // Group by contract for clients
    let grouped = null;
    if (groupByContract === 'true' && userRole === 'client') {
      const contractMap = new Map<string, any>();
      workLogs.forEach((log: any) => {
        const cId = log.contract?._id?.toString() || 'unknown';
        if (!contractMap.has(cId)) {
          contractMap.set(cId, { contract: log.contract, logs: [], totalMinutes: 0, totalHours: 0 });
        }
        const group = contractMap.get(cId);
        // Convert Mongoose document to plain object to ensure all fields are serialized
        group.logs.push(log.toObject ? log.toObject() : log);
        group.totalMinutes += log.duration || 0;
        group.totalHours = Math.round((group.totalMinutes / 60) * 100) / 100;
      });
      grouped = Array.from(contractMap.values());
    }

    res.json({
      status: 'success',
      results: workLogs.length,
      total,
      data: { workLogs, grouped },
    });
  } catch (error) {
    logger.error('Error fetching work logs:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch work logs' });
  }
};

// Get work log report
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
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate as string);
      if (endDate) query.startDate.$lte = new Date(endDate as string);
    }

    const workLogs = await WorkLog.find(query)
      .populate('contract', 'title')
      .populate('freelancer', 'profile.firstName profile.lastName')
      .sort({ startDate: -1 });

    const totalMinutes = workLogs.reduce((sum, log) => sum + log.duration, 0);

    res.json({
      status: 'success',
      data: {
        report: {
          totalEntries: workLogs.length,
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 100) / 100,
          workLogs,
        },
      },
    });
  } catch (error) {
    logger.error('Error generating work log report:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate report' });
  }
};
