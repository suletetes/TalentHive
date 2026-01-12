import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { emitToUser } from '@/config/socket';
import { sendEmail } from './email';
import { logger } from './logger';

interface NotificationData {
  userId: string;
  type: 'message' | 'proposal' | 'contract' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  link?: string;
  data?: any;
}

// Batch processing for notifications
class NotificationBatch {
  private batch: NotificationData[] = [];
  private batchSize = 50;
  private flushTimeout: NodeJS.Timeout | null = null;
  private flushDelay = 1000; // 1 second

  add(notification: NotificationData) {
    this.batch.push(notification);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.flushDelay);
    }
  }

  async flush() {
    if (this.batch.length === 0) return;

    const notifications = [...this.batch];
    this.batch = [];
    
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    try {
      // Batch insert notifications
      const createdNotifications = await Notification.insertMany(notifications);
      
      // Emit real-time notifications
      createdNotifications.forEach((notification, index) => {
        emitToUser(notifications[index].userId, 'notification', notification);
      });

      // Batch email processing
      await this.processBatchEmails(notifications, createdNotifications);
      
      logger.info(`Processed batch of ${notifications.length} notifications`);
    } catch (error) {
      logger.error('Error processing notification batch:', error);
      // Re-add failed notifications to batch for retry
      this.batch.unshift(...notifications);
    }
  }

  private async processBatchEmails(notifications: NotificationData[], createdNotifications: any[]) {
    // Get unique user IDs
    const userIds = [...new Set(notifications.map(n => n.userId))];
    
    // Batch fetch users
    const users = await User.find({ 
      _id: { $in: userIds }, 
      isActive: true 
    }).select('_id email emailPreferences').lean();
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    // Prepare batch emails
    const emailPromises = notifications.map((notification, index) => {
      const user = userMap.get(notification.userId);
      if (!user) return null;
      
      return sendEmail({
        to: user.email,
        subject: notification.title,
        text: notification.message,
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${notification.link ? `<p><a href="${process.env.CLIENT_URL}${notification.link}">View Details</a></p>` : ''}
        `,
      }).catch(error => {
        logger.error(`Failed to send email to ${user.email}:`, error);
      });
    }).filter(Boolean);
    
    // Send emails in parallel with concurrency limit
    const concurrencyLimit = 10;
    for (let i = 0; i < emailPromises.length; i += concurrencyLimit) {
      const batch = emailPromises.slice(i, i + concurrencyLimit);
      await Promise.allSettled(batch);
    }
  }
}

const notificationBatch = new NotificationBatch();

// Graceful shutdown - flush remaining notifications
process.on('SIGINT', () => notificationBatch.flush());
process.on('SIGTERM', () => notificationBatch.flush());

export const createNotification = async (notificationData: NotificationData) => {
  try {
    // Add to batch for processing
    notificationBatch.add(notificationData);
    
    // For immediate notifications (like messages), still create directly
    if (notificationData.type === 'message') {
      const notification = await Notification.create(notificationData);
      emitToUser(notificationData.userId, 'notification', notification);
      return notification;
    }
    
    return null; // Will be processed in batch
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

// For immediate notifications that need to return the created notification
export const createImmediateNotification = async (notificationData: NotificationData) => {
  try {
    const notification = await Notification.create(notificationData);

    // Emit real-time notification
    emitToUser(notificationData.userId, 'notification', notification);

    // Check user preferences and send email if enabled
    const user = await User.findById(notificationData.userId);

    if (user && user.isActive) {
      await sendEmail({
        to: user.email,
        subject: notificationData.title,
        text: notificationData.message,
        html: `
          <h2>${notificationData.title}</h2>
          <p>${notificationData.message}</p>
          ${notificationData.link ? `<p><a href="${process.env.CLIENT_URL}${notificationData.link}">View Details</a></p>` : ''}
        `,
      });
    }

    return notification;
  } catch (error) {
    logger.error('Error creating immediate notification:', error);
    throw error;
  }
};

const getEmailPreferenceKey = (type: string): string => {
  const mapping: Record<string, string> = {
    project: 'projectUpdates',
    proposal: 'proposalUpdates',
    contract: 'contractUpdates',
    payment: 'paymentUpdates',
    message: 'messages',
    review: 'reviews',
    system: 'marketing',
  };
  return mapping[type] || 'marketing';
};

export const notifyProjectUpdate = async (userId: string, projectTitle: string, action: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Project Update',
    message: `${action} on project: ${projectTitle}`,
    link: '/projects',
  });
};

export const notifyProposalReceived = async (userId: string, projectTitle: string) => {
  await createNotification({
    userId,
    type: 'proposal',
    title: 'New Proposal Received',
    message: `You received a new proposal for: ${projectTitle}`,
    link: '/proposals',
  });
};

export const notifyProposalAccepted = async (userId: string, projectTitle: string) => {
  await createNotification({
    userId,
    type: 'proposal',
    title: 'Proposal Accepted',
    message: `Your proposal for "${projectTitle}" has been accepted!`,
    link: '/proposals',
  });
};

export const notifyPaymentReceived = async (userId: string, amount: number) => {
  await createNotification({
    userId,
    type: 'payment',
    title: 'Payment Received',
    message: `You received a payment of $${amount}`,
    link: '/payments',
  });
};

export const notifyNewMessage = async (userId: string, senderName: string) => {
  await createNotification({
    userId,
    type: 'message',
    title: 'New Message',
    message: `${senderName} sent you a message`,
    link: '/messages',
  });
};

export const notifyNewReview = async (userId: string, rating: number) => {
  await createNotification({
    userId,
    type: 'review',
    title: 'New Review',
    message: `You received a ${rating}-star review`,
    link: '/profile',
  });
};