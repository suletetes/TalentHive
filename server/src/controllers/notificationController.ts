import { Request, Response, NextFunction } from 'express';
import { Notification, NotificationPreference } from '@/models/Notification';
import { AppError, catchAsync } from '@/middleware/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

export const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const query: any = { user: req.user._id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.json({
    status: 'success',
    data: {
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const markAsRead = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { notificationId } = req.params;

  const notification = await Notification.findOne({
    _id: notificationId,
    user: req.user._id,
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({
    status: 'success',
    data: { notification },
  });
});

export const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.json({
    status: 'success',
    message: 'All notifications marked as read',
  });
});

export const deleteNotification = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: req.user._id,
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.json({
    status: 'success',
    message: 'Notification deleted',
  });
});

export const getPreferences = catchAsync(async (req: AuthRequest, res: Response) => {
  let preferences = await NotificationPreference.findOne({ user: req.user._id });

  if (!preferences) {
    preferences = await NotificationPreference.create({ user: req.user._id });
  }

  res.json({
    status: 'success',
    data: { preferences },
  });
});

export const updatePreferences = catchAsync(async (req: AuthRequest, res: Response) => {
  const { email, push } = req.body;

  let preferences = await NotificationPreference.findOne({ user: req.user._id });

  if (!preferences) {
    preferences = await NotificationPreference.create({
      user: req.user._id,
      email,
      push,
    });
  } else {
    if (email) preferences.email = { ...preferences.email, ...email };
    if (push) preferences.push = { ...preferences.push, ...push };
    await preferences.save();
  }

  res.json({
    status: 'success',
    data: { preferences },
  });
});