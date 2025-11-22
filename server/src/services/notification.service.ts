import { Notification, INotification } from '../models/Notification';
import { socketService } from './socket.service';
import mongoose from 'mongoose';

interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: 'message' | 'proposal' | 'contract' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  link: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: {
    projectId?: string | mongoose.Types.ObjectId;
    proposalId?: string | mongoose.Types.ObjectId;
    contractId?: string | mongoose.Types.ObjectId;
    senderId?: string | mongoose.Types.ObjectId;
    amount?: number;
  };
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams): Promise<INotification> {
    try {
      const notification = await Notification.create({
        user: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        priority: params.priority || 'normal',
        metadata: params.metadata || {},
      });

      // Emit socket event for real-time notification
      socketService.emitToUser(params.userId.toString(), 'new_notification', {
        notification: await notification.populate('metadata.senderId', 'profile.firstName profile.lastName profile.avatar'),
      });

      return notification;
    } catch (error: any) {
      console.error('Create notification error:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Create notification for new message
   */
  async notifyNewMessage(recipientId: string, senderId: string, senderName: string, conversationId: string) {
    return this.createNotification({
      userId: recipientId,
      type: 'message',
      title: 'New Message',
      message: `${senderName} sent you a message`,
      link: `/dashboard/messages?conversation=${conversationId}`,
      priority: 'normal',
      metadata: {
        senderId,
      },
    });
  }

  /**
   * Create notification for new proposal
   */
  async notifyNewProposal(clientId: string, freelancerId: string, freelancerName: string, projectId: string, proposalId: string) {
    return this.createNotification({
      userId: clientId,
      type: 'proposal',
      title: 'New Proposal Received',
      message: `${freelancerName} submitted a proposal for your project`,
      link: `/dashboard/projects/${projectId}/proposals`,
      priority: 'high',
      metadata: {
        projectId,
        proposalId,
        senderId: freelancerId,
      },
    });
  }

  /**
   * Create notification for proposal accepted
   */
  async notifyProposalAccepted(freelancerId: string, clientName: string, projectId: string, proposalId: string) {
    return this.createNotification({
      userId: freelancerId,
      type: 'proposal',
      title: 'Proposal Accepted! 🎉',
      message: `${clientName} accepted your proposal`,
      link: `/dashboard/proposals/${proposalId}`,
      priority: 'high',
      metadata: {
        projectId,
        proposalId,
      },
    });
  }

  /**
   * Create notification for proposal rejected
   */
  async notifyProposalRejected(freelancerId: string, clientName: string, projectId: string, proposalId: string) {
    return this.createNotification({
      userId: freelancerId,
      type: 'proposal',
      title: 'Proposal Update',
      message: `${clientName} declined your proposal`,
      link: `/dashboard/proposals/${proposalId}`,
      priority: 'normal',
      metadata: {
        projectId,
        proposalId,
      },
    });
  }

  /**
   * Create notification for new contract
   */
  async notifyNewContract(freelancerId: string, clientName: string, contractId: string, projectId: string) {
    return this.createNotification({
      userId: freelancerId,
      type: 'contract',
      title: 'New Contract Created',
      message: `${clientName} created a contract with you`,
      link: `/dashboard/contracts/${contractId}`,
      priority: 'high',
      metadata: {
        contractId,
        projectId,
      },
    });
  }

  /**
   * Create notification for milestone submitted
   */
  async notifyMilestoneSubmitted(clientId: string, freelancerName: string, contractId: string, milestoneTitle: string) {
    return this.createNotification({
      userId: clientId,
      type: 'contract',
      title: 'Milestone Submitted',
      message: `${freelancerName} submitted "${milestoneTitle}" for review`,
      link: `/dashboard/contracts/${contractId}`,
      priority: 'high',
      metadata: {
        contractId,
      },
    });
  }

  /**
   * Create notification for milestone approved
   */
  async notifyMilestoneApproved(freelancerId: string, clientName: string, contractId: string, milestoneTitle: string) {
    return this.createNotification({
      userId: freelancerId,
      type: 'contract',
      title: 'Milestone Approved ✓',
      message: `${clientName} approved "${milestoneTitle}"`,
      link: `/dashboard/contracts/${contractId}`,
      priority: 'high',
      metadata: {
        contractId,
      },
    });
  }

  /**
   * Create notification for payment received
   */
  async notifyPaymentReceived(freelancerId: string, amount: number, contractId: string) {
    return this.createNotification({
      userId: freelancerId,
      type: 'payment',
      title: 'Payment Received 💰',
      message: `You received a payment of $${(amount / 100).toFixed(2)}`,
      link: `/dashboard/contracts/${contractId}`,
      priority: 'high',
      metadata: {
        contractId,
        amount,
      },
    });
  }

  /**
   * Create notification for payment released from escrow
   */
  async notifyEscrowReleased(freelancerId: string, amount: number, contractId: string) {
    return this.createNotification({
      userId: freelancerId,
      type: 'payment',
      title: 'Payment Released',
      message: `$${(amount / 100).toFixed(2)} has been released from escrow`,
      link: `/dashboard/contracts/${contractId}`,
      priority: 'high',
      metadata: {
        contractId,
        amount,
      },
    });
  }

  /**
   * Create notification for new review
   */
  async notifyNewReview(freelancerId: string, clientName: string, rating: number, projectId: string) {
    return this.createNotification({
      userId: freelancerId,
      type: 'review',
      title: 'New Review Received',
      message: `${clientName} left you a ${rating}-star review`,
      link: `/dashboard/profile`,
      priority: 'normal',
      metadata: {
        projectId,
      },
    });
  }

  /**
   * Create notification for contract dispute
   */
  async notifyContractDispute(userId: string, initiatorName: string, contractId: string, reason: string) {
    return this.createNotification({
      userId,
      type: 'contract',
      title: 'Contract Dispute',
      message: `${initiatorName} initiated a dispute: ${reason}`,
      link: `/dashboard/contracts/${contractId}`,
      priority: 'urgent',
      metadata: {
        contractId,
      },
    });
  }

  /**
   * Create system notification
   */
  async notifySystem(userId: string, title: string, message: string, link: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal') {
    return this.createNotification({
      userId,
      type: 'system',
      title,
      message,
      link,
      priority,
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
    try {
      const skip = (page - 1) * limit;
      const query: any = { user: userId };
      
      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .populate('metadata.senderId', 'profile.firstName profile.lastName profile.avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      };
    } catch (error: any) {
      console.error('Get user notifications error:', error);
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Emit socket event for unread count update
      const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
      socketService.emitToUser(userId, 'notification_read', { unreadCount });

      return notification;
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    try {
      await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true }
      );

      // Emit socket event for unread count update
      socketService.emitToUser(userId, 'notification_read', { unreadCount: 0 });

      return { success: true };
    } catch (error: any) {
      console.error('Mark all notifications as read error:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId,
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete notification error:', error);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    try {
      const count = await Notification.countDocuments({ user: userId, isRead: false });
      return count;
    } catch (error: any) {
      console.error('Get unread count error:', error);
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }
}

export const notificationService = new NotificationService();
