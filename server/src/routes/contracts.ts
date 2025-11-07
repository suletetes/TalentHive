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
} from '@/controllers/contractController';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my contracts
router.get('/my', getMyContracts);

// Create contract from accepted proposal
router.post('/proposal/:proposalId', createContractValidation, createContract);

// Get specific contract
router.get('/:id', getContract);

// Sign contract
router.post('/:id/sign', signContract);

// Cancel contract
router.post('/:id/cancel', cancelContract);

// Milestone management
router.post('/:id/milestones/:milestoneId/submit', submitMilestone);
router.post('/:id/milestones/:milestoneId/approve', approveMilestone);
router.post('/:id/milestones/:milestoneId/reject', rejectMilestone);

// Amendment management
router.post('/:id/amendments', proposeAmendment);
router.post('/:id/amendments/:amendmentId/respond', respondToAmendment);

export default router;