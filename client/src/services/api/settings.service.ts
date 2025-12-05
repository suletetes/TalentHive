import api from './core';

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
    api.get<{ data: PlatformSettings }>('/admin/settings'),

  // Update settings
  updateSettings: (data: Partial<PlatformSettings>) =>
    api.put('/admin/settings', data),

  // Get commission settings
  getCommissionSettings: () =>
    api.get<{ data: CommissionSetting[] }>('/admin/settings/commission'),

  // Update commission settings
  updateCommissionSettings: (commissionSettings: CommissionSetting[]) =>
    api.put('/admin/settings/commission', { commissionSettings }),
};
