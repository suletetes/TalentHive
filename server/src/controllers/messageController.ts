// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { Message, Conversation } from '@/models/Message';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { emitToConversation, emitToUser } from '@/config/socket';

interface AuthRequest extends Request {
  user?: any;
}

export const getConversations = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [conversations, total] = await Promise.all([
    Conversation.find({ participants: req.user._id, isArchived: false })
      .populate('participants', 'profile')
      .populate('lastMessage')
      .populate('project', 'title')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Conversation.countDocuments({ participants: req.user._id, isArchived: false }),
  ]);

  res.json({
    status: 'success',
    data: {
      conversations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const getOrCreateConversation = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { participantId, projectId } = req.body;

  const participants = [req.user._id, participantId].sort();

  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: 2 },
    project: projectId || null,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants,
      project: projectId,
    });
  }

  await conversation.populate('participants', 'profile');

  res.status(conversation.isNew ? 201 : 200).json({
    status: 'success',
    data: { conversation },
  });
});

export const getMessages = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  if (!conversation.participants.includes(req.user._id)) {
    return next(new AppError('Not authorized', 403));
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversationId, isDeleted: false })
      .populate('sender', 'profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Message.countDocuments({ conversation: conversationId, isDeleted: false }),
  ]);

  res.json({
    status: 'success',
    data: {
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const sendMessage = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { conversationId } = req.params;
  const { content, type = 'text', attachments = [] } = req.body;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  if (!conversation.participants.includes(req.user._id)) {
    return next(new AppError('Not authorized', 403));
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: req.user._id,
    content,
    type,
    attachments,
    readBy: [req.user._id],
  });

  await message.populate('sender', 'profile');

  // Update conversation
  conversation.lastMessage = message._id;
  conversation.participants.forEach(participantId => {
    if (participantId.toString() !== req.user._id.toString()) {
      const count = conversation.unreadCount.get(participantId.toString()) || 0;
      conversation.unreadCount.set(participantId.toString(), count + 1);
    }
  });
  await conversation.save();

  // Emit real-time event
  emitToConversation(conversationId, 'new_message', message);

  res.status(201).json({
    status: 'success',
    data: { message },
  });
});

export const markAsRead = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  if (!conversation.participants.includes(req.user._id)) {
    return next(new AppError('Not authorized', 403));
  }

  await Message.updateMany(
    {
      conversation: conversationId,
      readBy: { $ne: req.user._id },
    },
    {
      $addToSet: { readBy: req.user._id },
    }
  );

  conversation.unreadCount.set(req.user._id.toString(), 0);
  await conversation.save();

  emitToConversation(conversationId, 'messages_read', { userId: req.user._id });

  res.json({
    status: 'success',
    message: 'Messages marked as read',
  });
});