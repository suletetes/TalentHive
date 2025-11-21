import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '@/services/analytics.service';
import { AppError } from '@/middleware/errorHandler';

/**
 * Get user growth data
 */
export const getUserGrowth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return next(new AppError('Start date and end date are required', 400));
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }

    const data = await analyticsService.getUserGrowth(start, end);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch user growth data', 500));
  }
};

/**
 * Get revenue metrics
 */
export const getRevenueMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return next(new AppError('Start date and end date are required', 400));
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }

    const data = await analyticsService.getRevenueMetrics(start, end);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch revenue metrics', 500));
  }
};

/**
 * Get project statistics
 */
export const getProjectStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await analyticsService.getProjectStats();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch project statistics', 500));
  }
};

/**
 * Get top users (freelancers and clients)
 */
export const getTopUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const [topFreelancers, topClients] = await Promise.all([
      analyticsService.getTopFreelancers(limit),
      analyticsService.getTopClients(limit)
    ]);

    res.status(200).json({
      success: true,
      data: {
        topFreelancers,
        topClients
      }
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch top users', 500));
  }
};

/**
 * Get category distribution
 */
export const getCategoryDistribution = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await analyticsService.getCategoryDistribution();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch category distribution', 500));
  }
};
