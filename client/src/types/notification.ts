// Notification-related types

import { UserProfile } from './user';

export type NotificationType = 
  | 'proposal_received'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'contract_signed'
  | 'milestone_submitted'
  | 'milestone_approved'
  | 'milestone_rejected'
  | 'payment_received'
  | 'payment_released'
  | 'message_received'
  | 'project_updated'
  | 'system_announcement'
  | 'account_verification'
  | 'password_changed';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  _id: string;
  recipient: UserProfile | string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string;
  data?: NotificationData;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationData {
  projectId?: string;
  proposalId?: string;
  contractId?: string;
  milestoneId?: string;
  transactionId?: string;
  messageId?: string;
  userId?: string;
  amount?: number;
  currency?: string;
  [key: string]: any;
}

export interface NotificationPreferences {
  email: {
    proposals: boolean;
    contracts: boolean;
    payments: boolean;
    messages: boolean;
    marketing: boolean;
  };
  push: {
    proposals: boolean;
    contracts: boolean;
    payments: boolean;
    messages: boolean;
  };
  inApp: {
    proposals: boolean;
    contracts: boolean;
    payments: boolean;
    messages: boolean;
    system: boolean;
  };
}

export interface CreateNotificationDto {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: NotificationData;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface BulkNotificationAction {
  notificationIds: string[];
  action: 'mark_read' | 'mark_unread' | 'delete';
}