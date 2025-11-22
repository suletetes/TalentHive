import { Request, Response } from 'express';
import { PlatformSettings } from '../models/PlatformSettings';
import { AuthRequest } from '../middleware/auth';

export const settingsController = {
  // Get current platform settings
  getSettings: async (req: Request, res: Response) => {
    try {
      let settings = await PlatformSettings.findOne({ isActive: true });

      // If no settings exist, create default
      if (!settings) {
        settings = await PlatformSettings.create({
          isActive: true,
        });
      }

      res.json({
        status: 'success',
        data: settings,
      });
    } catch (error: any) {
      console.error('Get settings error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve settings',
        error: error.message,
      });
    }
  },

  // Update platform settings (Admin only)
  updateSettings: async (req: AuthRequest, res: Response) => {
    try {
      const {
        commissionRate,
        minCommission,
        maxCommission,
        paymentProcessingFee,
        currency,
        taxRate,
        withdrawalMinAmount,
        withdrawalFee,
        escrowHoldDays,
        refundPolicy,
        termsOfService,
        privacyPolicy,
      } = req.body;

      // Validation
      if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
        return res.status(400).json({
          status: 'error',
          message: 'Commission rate must be between 0 and 100',
        });
      }

      if (paymentProcessingFee !== undefined && (paymentProcessingFee < 0 || paymentProcessingFee > 100)) {
        return res.status(400).json({
          status: 'error',
          message: 'Payment processing fee must be between 0 and 100',
        });
      }

      if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
        return res.status(400).json({
          status: 'error',
          message: 'Tax rate must be between 0 and 100',
        });
      }

      let settings = await PlatformSettings.findOne({ isActive: true });

      if (!settings) {
        // Create new settings
        settings = await PlatformSettings.create({
          ...req.body,
          updatedBy: req.user?.userId,
          isActive: true,
        });
      } else {
        // Update existing settings
        Object.assign(settings, {
          ...req.body,
          updatedBy: req.user?.userId,
        });
        await settings.save();
      }

      res.json({
        status: 'success',
        message: 'Settings updated successfully',
        data: settings,
      });
    } catch (error: any) {
      console.error('Update settings error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update settings',
        error: error.message,
      });
    }
  },

  // Get settings history
  getSettingsHistory: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const settings = await PlatformSettings.find()
        .populate('updatedBy', 'profile.firstName profile.lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PlatformSettings.countDocuments();

      res.json({
        status: 'success',
        data: settings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Get settings history error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve settings history',
        error: error.message,
      });
    }
  },

  // Calculate commission for a given amount
  calculateCommission: async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid amount is required',
        });
      }

      const settings = await PlatformSettings.findOne({ isActive: true });

      if (!settings) {
        return res.status(404).json({
          status: 'error',
          message: 'Platform settings not found',
        });
      }

      // Calculate commission
      let commission = Math.round((amount * settings.commissionRate) / 100);

      // Apply min/max limits
      if (commission < settings.minCommission) {
        commission = settings.minCommission;
      }
      if (commission > settings.maxCommission) {
        commission = settings.maxCommission;
      }

      // Calculate payment processing fee
      const processingFee = Math.round((amount * settings.paymentProcessingFee) / 100);

      // Calculate tax
      const tax = Math.round((amount * settings.taxRate) / 100);

      // Calculate totals
      const totalFees = commission + processingFee + tax;
      const freelancerReceives = amount - totalFees;

      res.json({
        status: 'success',
        data: {
          amount,
          commission,
          processingFee,
          tax,
          totalFees,
          freelancerReceives,
          currency: settings.currency,
          breakdown: {
            commissionRate: settings.commissionRate,
            processingFeeRate: settings.paymentProcessingFee,
            taxRate: settings.taxRate,
          },
        },
      });
    } catch (error: any) {
      console.error('Calculate commission error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to calculate commission',
        error: error.message,
      });
    }
  },
};
