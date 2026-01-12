import { Request, Response, NextFunction } from 'express';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { AppError } from '../middleware/errorHandler';
import { socketService } from '../services/socket.service';

/**
 * Edit a message
 */
export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user!._id.toString();

    if (!content || content.trim().length === 0) {
      return next(new AppError('Message content is required', 400));
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return next(new AppError('You can only edit your own messages', 403));
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      return next(new AppError('Cannot edit a deleted message', 400));
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'profile');

    // Emit socket event
    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      conversation.participants.forEach((participantId) => {
        socketService.emitToUser(participantId.toString(), 'message_edited', {
          conversationId: message.conversation.toString(),
          message,
        });
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to edit message', 500));
  }
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = req.user!._id.toString();

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return next(new AppError('You can only delete your own messages', 403));
    }

    // Check if already deleted
    if (message.isDeleted) {
      return next(new AppError('Message is already deleted', 400));
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message has been deleted';
    await message.save();

    // Emit socket event
    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      conversation.participants.forEach((participantId) => {
        socketService.emitToUser(participantId.toString(), 'message_deleted', {
          conversationId: message.conversation.toString(),
          messageId: message._id.toString(),
        });
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to delete message', 500));
  }
};

/**
 * Add reaction to a message
 */
export const addReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!._id.toString();

    if (!emoji) {
      return next(new AppError('Emoji is required', 400));
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Check if message is deleted
    if (message.isDeleted) {
      return next(new AppError('Cannot react to a deleted message', 400));
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === userId && r.emoji === emoji
    );

    if (existingReaction) {
      return next(new AppError('You already reacted with this emoji', 400));
    }

    // Add reaction
    message.reactions.push({
      user: userId as any,
      emoji,
      createdAt: new Date(),
    });
    await message.save();

    await message.populate('reactions.user', 'profile');

    // Emit socket event
    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      conversation.participants.forEach((participantId) => {
        socketService.emitToUser(participantId.toString(), 'message_reaction_added', {
          conversationId: message.conversation.toString(),
          messageId: message._id.toString(),
          reaction: message.reactions[message.reactions.length - 1],
        });
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to add reaction', 500));
  }
};

/**
 * Remove reaction from a message
 */
export const removeReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!._id.toString();

    if (!emoji) {
      return next(new AppError('Emoji is required', 400));
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Find and remove reaction
    const reactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId && r.emoji === emoji
    );

    if (reactionIndex === -1) {
      return next(new AppError('Reaction not found', 404));
    }

    message.reactions.splice(reactionIndex, 1);
    await message.save();

    // Emit socket event
    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      conversation.participants.forEach((participantId) => {
        socketService.emitToUser(participantId.toString(), 'message_reaction_removed', {
          conversationId: message.conversation.toString(),
          messageId: message._id.toString(),
          userId,
          emoji,
        });
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reaction removed successfully',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to remove reaction', 500));
  }
};

/**
 * Emit typing indicator
 */
export const emitTyping = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { isTyping } = req.body;
    const userId = req.user!._id.toString();

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    if (!conversation.participants.map(p => p.toString()).includes(userId)) {
      return next(new AppError('Not authorized to access this conversation', 403));
    }

    // Emit typing indicator to other participants
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== userId) {
        socketService.emitToUser(participantId.toString(), 'user_typing', {
          conversationId,
          userId,
          isTyping,
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Typing indicator sent',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to emit typing indicator', 500));
  }
};
