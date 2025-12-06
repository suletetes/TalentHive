import { apiCore } from './core';

export interface CreateDisputeData {
  title: string;
  description: string;
  type: 'project' | 'contract' | 'payment' | 'user' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  respondent?: string;
  project?: string;
  contract?: string;
  transaction?: string;
  evidence?: string[];
}

export interface AddMessageData {
  message: string;
}

export const disputesService = {
  // Create a new dispute
  createDispute: (data: CreateDisputeData) =>
    apiCore.post('/disputes', data),

  // Get all disputes (admin)
  getAllDisputes: (params?: { page?: number; limit?: number; status?: string; priority?: string; type?: string }) =>
    apiCore.get('/disputes', { params }),

  // Get user's disputes
  getMyDisputes: (params?: { page?: number; limit?: number; status?: string }) =>
    apiCore.get('/disputes/my', { params }),

  // Get dispute by ID
  getDisputeById: (id: string) =>
    apiCore.get(`/disputes/${id}`),

  // Add message to dispute
  addMessage: (id: string, data: AddMessageData) =>
    apiCore.post(`/disputes/${id}/messages`, data),

  // Update dispute status (admin)
  updateStatus: (id: string, data: { status: string; resolution?: string }) =>
    apiCore.patch(`/disputes/${id}/status`, data),

  // Assign dispute to admin
  assignDispute: (id: string, adminId?: string) =>
    apiCore.patch(`/disputes/${id}/assign`, { adminId }),

  // Get dispute statistics (admin)
  getStats: () =>
    apiCore.get('/disputes/stats/overview'),
};
