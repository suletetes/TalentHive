import { Router } from 'express';
import {
  createProposal,
  createProposalValidation,
  getProposalsForProject,
  getMyProposals,
  getProposalById,
  updateProposal,
  withdrawProposal,
  acceptProposal,
  rejectProposal,
  highlightProposal,
  getProposalStats,
} from '@/controllers/proposalController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Public routes
router.get('/project/:projectId', getProposalsForProject);
router.get('/:id', getProposalById);

// Protected routes (require authentication)
router.use(authenticate);

// Freelancer routes
router.post('/project/:projectId', authorize('freelancer'), createProposalValidation, createProposal);
router.get('/my/proposals', authorize('freelancer'), getMyProposals);
router.put('/:id', authorize('freelancer'), updateProposal);
router.delete('/:id', authorize('freelancer'), withdrawProposal);
router.patch('/:id/highlight', authorize('freelancer'), highlightProposal);

// Client routes
router.post('/:id/accept', authorize('client'), acceptProposal);
router.post('/:id/reject', authorize('client'), rejectProposal);

// General stats
router.get('/my/stats', getProposalStats);

export default router;