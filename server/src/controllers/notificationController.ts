import { Request, Response } from 'express';
import { Notification } from '@/models/Notification';
import { AuthRequest } from '@/types/auth';
import { socketService } from '@/services/socket.service';

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { user: userId };

    // Filter by type
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Filter by read status
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('metadata.senderId', 'profile.firstName profile.lastName profile.avatar');

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user._id;

    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.status(200).json({
      status: 'success',
      data: { count },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch unread count',
      error: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user._id;

    const notification = await Notification.findOne({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user._id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
};

// Create notification (internal use)
export const createNotification = async (data: {
  user: string;
  type: 'message' | 'proposal' | 'contract' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  link: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: any;
}) => {
  try {
    const notification = await Notification.create(data);

    // Emit real-time notification via Socket.io
    socketService.emitToUser(data.user, 'new_notification', {
      notification: await notification.populate('metadata.senderId', 'profile.firstName profile.lastName profile.avatar'),
    });

    return notification;
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

// Bulk create notifications
export const createBulkNotifications = async (notifications: Array<{
  user: string;
  type: 'message' | 'proposal' | 'contract' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  link: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: any;
}>) => {
  try {
    const created = await Notification.insertMany(notifications);

    // Emit real-time notifications
    created.forEach((notification) => {
      socketService.emitToUser(notification.user.toString(), 'new_notification', {
        notification,
      });
    });

    return created;
  } catch (error: any) {
    console.error('Failed to create bulk notifications:', error);
    throw error;
  }
};
