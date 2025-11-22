import { Router } from 'express';
import {
  createContract,
  createContractValidation,
  getContract,
  getMyContracts,
  signContract,
  submitMilestone,
  approveMilestone,
  rejectMilestone,
  proposeAmendment,
  respondToAmendment,
  cancelContract,
  createDispute,
  pauseContract,
  resumeContract,
} from '@/controllers/contractController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my contracts (both clients and freelancers)
router.get('/my', getMyContracts);

// Create contract from accepted proposal (clients only)
router.post('/proposal/:proposalId', authorize('client'), createContractValidation, createContract);

// Get specific contract
router.get('/:id', getContract);

// Sign contract
router.post('/:id/sign', signContract);

// Contract status management
router.post('/:id/cancel', cancelContract);
router.post('/:id/pause', pauseContract);
router.post('/:id/resume', resumeContract);
router.post('/:id/dispute', createDispute);

// Milestone management
router.post('/:id/milestones/:milestoneId/submit', submitMilestone);
router.post('/:id/milestones/:milestoneId/approve', approveMilestone);
router.post('/:id/milestones/:milestoneId/reject', rejectMilestone);

// Amendment management
router.post('/:id/amendments', proposeAmendment);
router.post('/:id/amendments/:amendmentId/respond', respondToAmendment);

export default router;