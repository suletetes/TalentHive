import { apiCore } from './core';

export interface HireNowRequest {
  _id: string;
  client: any;
  freelancer: any;
  projectTitle: string;
  projectDescription: string;
  budget: number;
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  milestones: Array<{
    title: string;
    description: string;
    amount: number;
    dueDate: string;
  }>;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class HireNowService {
  private basePath = '/hire-now';

  // Client: Send hire now request to a freelancer
  async sendRequest(freelancerId: string, data: {
    projectTitle: string;
    projectDescription: string;
    budget: number;
    timeline: {
      duration: number;
      unit: 'days' | 'weeks' | 'months';
    };
    milestones?: Array<{
      title: string;
      description: string;
      amount: number;
      dueDate: string;
    }>;
    message?: string;
  }) {
    return apiCore.post(`${this.basePath}/${freelancerId}`, data);
  }

  // Client: Get all sent hire now requests
  async getSentRequests() {
    return apiCore.get(`${this.basePath}/sent`);
  }

  // Freelancer: Get all received hire now requests
  async getReceivedRequests() {
    return apiCore.get(`${this.basePath}/received`);
  }

  // Freelancer: Accept a hire now request
  async acceptRequest(requestId: string, responseMessage?: string) {
    return apiCore.put(`${this.basePath}/${requestId}/accept`, { responseMessage });
  }

  // Freelancer: Reject a hire now request
  async rejectRequest(requestId: string, responseMessage?: string) {
    return apiCore.put(`${this.basePath}/${requestId}/reject`, { responseMessage });
  }
}

export const hireNowService = new HireNowService();
