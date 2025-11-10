import { apiCore } from './core';

export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  email: {
    messages: boolean;
    proposals: boolean;
    contracts: boolean;
    payments: boolean;
  };
  push: {
    messages: boolean;
    proposals: boolean;
    contracts: boolean;
    payments: boolean;
  };
}

export class NotificationsService {
  private basePath = '/notifications';

  async getNotifications(params?: {
    unread?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Notification[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get<{ data: Notification[]; pagination: any }>(
      `${this.basePath}?${queryParams.toString()}`
    );
  }

  async markAsRead(notificationId: string): Promise<{ message: string }> {
    return apiCore.patch<{ message: string }>(`${this.basePath}/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<{ message: string }> {
    return apiCore.patch<{ message: string }>(`${this.basePath}/read-all`);
  }

  async getUnreadCount(): Promise<{ data: { count: number } }> {
    return apiCore.get<{ data: { count: number } }>(`${this.basePath}/unread-count`);
  }

  async getPreferences(): Promise<{ data: NotificationPreferences }> {
    return apiCore.get<{ data: NotificationPreferences }>(`${this.basePath}/preferences`);
  }

  async updatePreferences(
    preferences: NotificationPreferences
  ): Promise<{ data: NotificationPreferences }> {
    return apiCore.put<{ data: NotificationPreferences }>(
      `${this.basePath}/preferences`,
      preferences
    );
  }
}

export const notificationsService = new NotificationsService();
