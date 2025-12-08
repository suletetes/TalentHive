import express from 'express';
import { authenticate } from '@/middleware/auth';
import {
  createTicket,
  getTickets,
  getTicketById,
  addMessage,
  updateTicketStatus,
  assignTicket,
  updateTicketTags,
  getTicketStats,
} from '@/controllers/supportTicketController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get ticket statistics (admin only) - must be before /:ticketId
router.get('/stats', getTicketStats);

// Create new ticket
router.post('/', createTicket);

// Get all tickets (user's tickets or all for admin)
router.get('/', getTickets);

// Get ticket by ID
router.get('/:ticketId', getTicketById);

// Add message to ticket
router.post('/:ticketId/messages', addMessage);

// Update ticket status (admin only)
router.patch('/:ticketId/status', updateTicketStatus);

// Assign ticket to admin (admin only)
router.patch('/:ticketId/assign', assignTicket);

// Update ticket tags (admin only)
router.patch('/:ticketId/tags', updateTicketTags);

export default router;
