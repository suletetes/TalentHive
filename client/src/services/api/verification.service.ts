import { apiCore } from './core';

export interface VerificationBadge {
  _id?: string;
  type: 'identity' | 'skills' | 'trusted';
  status: 'pending' | 'approved' | 'rejected' | 'not_requested';
  requestedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  qualifies?: boolean;
  requirements?: {
    missing?: string[];
  };
}

export interface VerificationStatusResponse {
  status: string;
  data: {
    badges: VerificationBadge[];
  };
}

export interface PendingVerificationRequest {
  requestId: string;
  freelancer: {
    _id: string;
    fullName: string;
    email: string;
    profileSlug: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
      bio?: string;
      location?: string;
    };
    skills?: string[];
    portfolio?: any[];
    rating: {
      average: number;
      count: number;
    };
  };
  badgeType: string;
  requestedAt: Date;
  requirements: {
    qualifies: boolean;
    missing: string[];
  };
}

export interface VerificationStatsResponse {
  status: string;
  data: {
    pending: {
      identity: number;
      skills: number;
      trusted: number;
      total: number;
    };
    approved: {
      identity: number;
      skills: number;
      trusted: number;
      total: number;
    };
    rejected: {
      identity: number;
      skills: number;
      trusted: number;
      total: number;
    };
  };
}

export class VerificationService {
  private basePath = '/verification';

  /**
   * Request a verification badge
   */
  async requestVerification(badgeType: 'identity' | 'skills' | 'trusted'): Promise<any> {
    return apiCore.post(`${this.basePath}/request/${badgeType}`);
  }

  /**
   * Get verification status for current user
   */
  async getVerificationStatus(): Promise<VerificationStatusResponse> {
    return apiCore.get(`${this.basePath}/status`);
  }

  /**
   * Cancel a pending verification request
   */
  async cancelVerificationRequest(badgeType: string): Promise<any> {
    return apiCore.delete(`${this.basePath}/request/${badgeType}`);
  }

  /**
   * Get pending verification requests (Admin only)
   */
  async getPendingVerifications(params?: {
    badgeType?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    status: string;
    data: {
      requests: PendingVerificationRequest[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.badgeType) queryParams.append('badgeType', params.badgeType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return apiCore.get(`${this.basePath}/admin/pending?${queryParams.toString()}`);
  }

  /**
   * Review a verification request (Admin only)
   */
  async reviewVerification(data: {
    userId: string;
    badgeType: string;
    action: 'approve' | 'reject';
    notes?: string;
    rejectionReason?: string;
  }): Promise<any> {
    return apiCore.post(`${this.basePath}/admin/review`, data);
  }

  /**
   * Get verification statistics (Admin only)
   */
  async getVerificationStats(): Promise<VerificationStatsResponse> {
    return apiCore.get(`${this.basePath}/admin/stats`);
  }

  /**
   * Get freelancer verification details (Admin only)
   */
  async getFreelancerVerificationDetails(userId: string): Promise<any> {
    return apiCore.get(`${this.basePath}/admin/freelancer/${userId}`);
  }
}

export const verificationService = new VerificationService();
