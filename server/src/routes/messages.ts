import { Router } from 'express';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getAllConversations,
  adminCreateConversation,
  sendAdminMessage,
  uploadMessageAttachments,
} from '@/controllers/messageController';
import {
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  emitTyping,
} from '@/controllers/messageEnhancementController';
import { authenticate, authorize } from '@/middleware/auth';
import { upload } from '@/utils/fileUpload';

const router = Router();

router.use(authenticate);

// Admin-only routes
router.get('/admin/all-conversations', authorize('admin'), getAllConversations);
router.post('/admin/create-conversation', authorize('admin'), adminCreateConversation);
router.post('/admin/conversations/:conversationId/messages', authorize('admin'), sendAdminMessage);

// Regular user routes
router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.post('/conversations/:conversationId/read', markAsRead);

// Message enhancement routes
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
router.post('/messages/:messageId/reactions', addReaction);
router.delete('/messages/:messageId/reactions', removeReaction);
router.post('/conversations/:conversationId/typing', emitTyping);

// File upload for messages
router.post('/upload-attachments', upload.array('files', 10), uploadMessageAttachments);

export default router;