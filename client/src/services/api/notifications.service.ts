import { apiCore } from './core';

export interface Notification {
  _id: string;
  user: string;
  type: 'message' | 'proposal' | 'contract' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata: {
    projectId?: string;
    proposalId?: string;
    contractId?: string;
    senderId?: {
      _id: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
    };
    amount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class NotificationsService {
  private basePath = '/notifications';

  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
  }): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get<NotificationResponse>(
      `${this.basePath}?${queryParams.toString()}`
    );
  }

  async getUnreadCount(): Promise<{ data: { count: number } }> {
    return apiCore.get<{ data: { count: number } }>(`${this.basePath}/unread-count`);
  }

  async markAsRead(notificationId: string): Promise<{ data: Notification }> {
    return apiCore.put<{ data: Notification }>(
      `${this.basePath}/${notificationId}/read`,
      {}
    );
  }

  async markAllAsRead(): Promise<{ message: string }> {
    return apiCore.put<{ message: string }>(`${this.basePath}/mark-all-read`, {});
  }

  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/${notificationId}`);
  }
}

export const notificationsService = new NotificationsService();
