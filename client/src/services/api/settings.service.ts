import { apiCore } from './core';

export interface CommissionSetting {
  name: string;
  commissionPercentage: number;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  isActive: boolean;
}

export interface PlatformSettings {
  platformFee: number;
  escrowPeriodDays: number;
  minWithdrawalAmount: number;
  maintenanceMode: boolean;
  commissionSettings: CommissionSetting[];
}

export const settingsService = {
  // Get all settings
  getSettings: () =>
    apiCore.get<{ data: PlatformSettings }>('/admin/settings'),

  // Update settings
  updateSettings: (data: Partial<PlatformSettings>) =>
    apiCore.put('/admin/settings', data),

  // Get commission settings
  getCommissionSettings: () =>
    apiCore.get<{ data: CommissionSetting[] }>('/admin/settings/commission'),

  // Update commission settings
  updateCommissionSettings: (commissionSettings: CommissionSetting[]) =>
    apiCore.put('/admin/settings/commission', { commissionSettings }),
};
