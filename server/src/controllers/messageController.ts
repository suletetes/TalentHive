import { Request, Response, NextFunction } from 'express';
import { Conversation } from '@/models/Conversation';
import { Message } from '@/models/Message';
import { AppError } from '@/middleware/errorHandler';
import { socketService } from '@/services/socket.service';

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'profile email')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch conversations', 500));
  }
};

/**
 * Get or create a conversation between users
 */
export const getOrCreateConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { participantId } = req.body;
    const userId = req.user!._id;

    if (!participantId) {
      return next(new AppError('Participant ID is required', 400));
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
    })
      .populate('participants', 'profile email')
      .populate('lastMessage');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [userId, participantId],
        unreadCount: new Map(),
      });

      await conversation.populate('participants', 'profile email');
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get or create conversation', 500));
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!._id.toString();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    if (!conversation.participants.map(p => p.toString()).includes(userId)) {
      return next(new AppError('Not authorized to view this conversation', 403));
    }

    // Get messages with pagination
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'profile')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Message.countDocuments({ conversation: conversationId });

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch messages', 500));
  }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;
    const userId = req.user!._id.toString();

    if (!content || content.trim().length === 0) {
      return next(new AppError('Message content is required', 400));
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    if (!conversation.participants.map(p => p.toString()).includes(userId)) {
      return next(new AppError('Not authorized to send messages in this conversation', 403));
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
      attachments: attachments || [],
      readBy: [userId],
    });

    await message.populate('sender', 'profile');

    // Update conversation
    conversation.lastMessage = message._id as any;
    conversation.lastMessageAt = new Date();

    // Update unread count for other participants
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== userId.toString()) {
        const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    // Emit socket event for real-time delivery
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== userId.toString()) {
        socketService.emitToUser(participantId.toString(), 'new_message', {
          conversationId,
          message,
        });
      }
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to send message', 500));
  }
};

/**
 * Mark messages as read in a conversation
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!._id.toString();

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    if (!conversation.participants.map(p => p.toString()).includes(userId)) {
      return next(new AppError('Not authorized to access this conversation', 403));
    }

    // Mark all messages as read by this user
    await Message.updateMany(
      {
        conversation: conversationId,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    // Emit socket event
    socketService.emitToUser(userId, 'messages_read', {
      conversationId,
    });

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to mark messages as read', 500));
  }
};
