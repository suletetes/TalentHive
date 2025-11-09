// @ts-nocheck
import { Notification, NotificationPreference } from '@/models/Notification';
import { User } from '@/models/User';
import { emitToUser } from '@/config/socket';
import { sendEmail } from './email';
import { logger } from './logger';

interface NotificationData {
  userId: string;
  type: 'project' | 'proposal' | 'contract' | 'payment' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  link?: string;
  data?: any;
}

export const createNotification = async (notificationData: NotificationData) => {
  try {
    const notification = await Notification.create(notificationData);

    // Emit real-time notification
    emitToUser(notificationData.userId, 'notification', notification);

    // Check preferences and send email if enabled
    const preferences = await NotificationPreference.findOne({ user: notificationData.userId });
    const user = await User.findById(notificationData.userId);

    if (user && preferences) {
      const emailKey = getEmailPreferenceKey(notificationData.type);
      if (preferences.email[emailKey]) {
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
    }

    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

const getEmailPreferenceKey = (type: string): keyof INotificationPreference['email'] => {
  const mapping: Record<string, keyof INotificationPreference['email']> = {
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
    type: 'project',
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