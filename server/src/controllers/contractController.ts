import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Contract } from '@/models/Contract';
import { Proposal } from '@/models/Proposal';
import { Project } from '@/models/Project';
import { User } from '@/models/User';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { deleteCache } from '@/config/redis';
import { notificationService } from '@/services/notification.service';
import crypto from 'crypto';

// Helper function to extract user ID from populated or unpopulated field
const extractUserId = (userField: any): string => {
  if (!userField) {
    console.warn('[EXTRACT_USER_ID] Received null/undefined userField');
    return '';
  }
  
  try {
    // If it's a string, validate and return
    if (typeof userField === 'string') {
      if (/^[a-f\d]{24}$/i.test(userField)) {
        return userField;
      } else {
        console.warn('[EXTRACT_USER_ID] Invalid ObjectId string format:', userField);
        return '';
      }
    }
    
    // If it's an ObjectId, convert to string
    if (userField instanceof mongoose.Types.ObjectId) {
      return userField.toString();
    }
    
    // If it's a populated object with _id
    if (typeof userField === 'object' && userField._id) {
      const id = userField._id instanceof mongoose.Types.ObjectId 
        ? userField._id.toString() 
        : String(userField._id);
      
      if (/^[a-f\d]{24}$/i.test(id)) {
        return id;
      } else {
        console.warn('[EXTRACT_USER_ID] Invalid ObjectId in _id field:', id);
        return '';
      }
    }
    
    // If it has an id property (virtual)
    if (typeof userField === 'object' && userField.id) {
      const id = String(userField.id);
      if (/^[a-f\d]{24}$/i.test(id)) {
        return id;
      } else {
        console.warn('[EXTRACT_USER_ID] Invalid ObjectId in id field:', id);
        return '';
      }
    }
    
    // Last resort - try to convert to string but check if it looks like an ObjectId
    const str = String(userField);
    if (/^[a-f\d]{24}$/i.test(str)) {
      return str;
    }
    
    console.warn('[EXTRACT_USER_ID] Could not extract valid ObjectId from:', typeof userField, userField);
    return '';
  } catch (error) {
    console.error('[EXTRACT_USER_ID] Error extracting user ID:', error);
    return '';
  }
};

export const createContractValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
];

export const createContract = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return next(new AppError(errorMessages, 400));
  }

  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const { proposalId } = req.params;
  const { title, description, startDate, endDate, terms, customMilestones } = req.body;

  // Get the accepted proposal
  const proposal = await Proposal.findById(proposalId)
    .populate('project')
    .populate('freelancer');

  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  if (proposal.status !== 'accepted') {
    return next(new AppError('Only accepted proposals can be converted to contracts', 400));
  }

  const project = proposal.project as any;
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user is the project owner
  const projectClientId = typeof project.client === 'object' ? project.client._id : project.client;
  if (projectClientId.toString() !== userId.toString()) {
    return next(new AppError('You can only create contracts for your own projects', 403));
  }

  // Check if contract already exists for this proposal
  const existingContract = await Contract.findOne({ proposal: proposalId });
  if (existingContract) {
    return next(new AppError('Contract already exists for this proposal', 400));
  }

  // Use custom milestones or proposal milestones - always generate explicit _id
  const milestones = (customMilestones || proposal.milestones).map((milestone: any) => ({
    _id: new mongoose.Types.ObjectId(),
    title: milestone.title,
    description: milestone.description,
    amount: milestone.amount,
    dueDate: milestone.dueDate,
    status: 'pending',
  }));

  // Create contract
  const contractData = {
    project: project._id,
    client: project.client,
    freelancer: proposal.freelancer.toString(),
    proposal: proposalId,
    title,
    description,
    totalAmount: proposal.bidAmount,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    milestones,
    terms: {
      paymentTerms: terms?.paymentTerms || 'Payment will be released upon milestone completion and client approval.',
      cancellationPolicy: terms?.cancellationPolicy || 'Either party may cancel this contract with 7 days written notice.',
      intellectualProperty: terms?.intellectualProperty || 'All work product created under this contract will be owned by the client.',
      confidentiality: terms?.confidentiality || 'Both parties agree to maintain confidentiality of all project information.',
      disputeResolution: terms?.disputeResolution || 'Disputes will be resolved through the platform\'s dispute resolution process.',
      additionalTerms: terms?.additionalTerms,
    },
    status: 'draft',
  };

  const contract = new Contract(contractData);
  await contract.save();

  // Populate contract data for response
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  // Send notification to freelancer
  try {
    const client = await User.findById(userId);
    if (client?.profile) {
      const clientName = `${client.profile.firstName} ${client.profile.lastName}`;
      // ISSUE #14 FIX: Extract ID from freelancer (might be populated object)
      const freelancerObj = proposal.freelancer as any;
      const freelancerId = typeof freelancerObj === 'object' && freelancerObj._id
        ? freelancerObj._id.toString()
        : freelancerObj.toString();
      await notificationService.notifyNewContract(
        freelancerId,
        clientName,
        contract._id.toString(),
        project._id.toString()
      );
    }
  } catch (error) {
    console.error('Failed to send contract notification:', error);
  }

  res.status(201).json({
    status: 'success',
    message: 'Contract created successfully',
    data: {
      contract,
    },
  });
});

export const getContract = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const contract = await Contract.findById(id)
    .populate('client', 'profile')
    .populate('freelancer', 'profile freelancerProfile rating')
    .populate('project', 'title description')
    .populate('proposal', 'coverLetter bidAmount');

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  res.json({
    status: 'success',
    data: {
      contract,
    },
  });
});

interface AuthRequest extends Request {
  user?: any;
}

export const getMyContracts = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, status, role } = req.query;

  console.log('[GET MY CONTRACTS] ========== START ==========');
  console.log('[GET MY CONTRACTS] User ID:', req.user?._id);
  console.log('[GET MY CONTRACTS] User Role:', req.user?.role);
  console.log('[GET MY CONTRACTS] Query params:', { page, limit, status, role });

  const query: any = {};

  // Filter by user role
  const userId = req.user?._id;
  if (!userId) {
    console.log('[GET MY CONTRACTS] ❌ No user ID - unauthorized');
    return next(new AppError('Unauthorized', 401));
  }

  if (role === 'client') {
    query.client = userId;
    console.log('[GET MY CONTRACTS] Filtering by client:', userId);
  } else if (role === 'freelancer') {
    query.freelancer = userId;
    console.log('[GET MY CONTRACTS] Filtering by freelancer:', userId);
  } else {
    // Show all contracts where user is either client or freelancer
    query.$or = [
      { client: userId },
      { freelancer: userId },
    ];
    console.log('[GET MY CONTRACTS] Filtering by client OR freelancer:', userId);
  }

  if (status) {
    query.status = status;
    console.log('[GET MY CONTRACTS] Filtering by status:', status);
  }

  console.log('[GET MY CONTRACTS] Final query:', JSON.stringify(query, null, 2));

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  let contracts, total;
  try {
    [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate('client', 'profile rating')
        .populate('freelancer', 'profile freelancerProfile rating')
        .populate('project', 'title description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      Contract.countDocuments(query),
    ]);
  } catch (error) {
    console.error('[GET MY CONTRACTS] Database query failed:', error);
    return next(new AppError('Failed to fetch contracts', 500));
  }

  console.log('[GET MY CONTRACTS] Found contracts:', contracts.length);
  console.log('[GET MY CONTRACTS] Total in DB:', total);
  
  // Debug each contract (removed sensitive data)
  contracts.forEach((contract: any, index: number) => {
    console.log(`[GET MY CONTRACTS] Contract ${index + 1}:`, {
      id: contract._id ? 'present' : 'missing',
      title: contract.title ? 'present' : 'missing',
      status: contract.status,
      sourceType: contract.sourceType || 'NOT SET',
      hasClient: !!contract.client,
      hasFreelancer: !!contract.freelancer,
      hasServicePackage: !!contract.servicePackage,
      hasHireNowRequest: !!contract.hireNowRequest,
    });
  });

  // Count by source type
  const bySource = contracts.reduce((acc: any, c: any) => {
    const source = c.sourceType || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  console.log('[GET MY CONTRACTS] By source type:', bySource);

  console.log('[GET MY CONTRACTS] ========== END ==========');

  res.json({
    status: 'success',
    data: {
      contracts: contracts || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const signContract = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const clientId = contract.client.toString();
  const freelancerId = contract.freelancer.toString();
  
  const isParticipant = [clientId, freelancerId]
    .includes(userId.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to sign this contract', 403));
  }

  // Check if user already signed
  const existingSignature = contract.signatures.find(
    (sig: any) => sig.signedBy.toString() === userId.toString()
  );

  if (existingSignature) {
    return next(new AppError('You have already signed this contract', 400));
  }

  // Create signature
  const signatureData = {
    signedBy: userId,
    signedAt: new Date(),
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    signatureHash: crypto.createHash('sha256')
      .update(`${userId}-${Date.now()}-${req.ip}`)
      .digest('hex'),
  };

  contract.signatures.push(signatureData as any);

  // If both parties signed, activate the contract
  if (contract.isFullySigned()) {
    contract.status = 'active';
  }

  await contract.save();

  res.json({
    status: 'success',
    message: 'Contract signed successfully',
    data: {
      contract,
      isFullySigned: contract.isFullySigned(),
    },
  });
});

export const submitMilestone = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, milestoneId } = req.params;
  const { deliverables, freelancerNotes } = req.body;

  console.log('[SUBMIT MILESTONE] Starting...', { contractId: id, milestoneId });

  const contract = await Contract.findById(id);
  if (!contract) {
    console.log('[SUBMIT MILESTONE] Contract not found');
    return next(new AppError('Contract not found', 404));
  }

  console.log('[SUBMIT MILESTONE] Contract found:', { 
    status: contract.status, 
    freelancer: contract.freelancer.toString(),
    milestonesCount: contract.milestones?.length 
  });

  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  console.log('[SUBMIT MILESTONE] User:', userId.toString());

  const canSubmit = contract.canSubmitMilestone(milestoneId, userId.toString());
  console.log('[SUBMIT MILESTONE] canSubmitMilestone:', canSubmit);

  if (!canSubmit) {
    console.log('[SUBMIT MILESTONE] Cannot submit - checking why...');
    const isFreelancer = contract.freelancer.toString() === userId.toString();
    const ms = contract.milestones.find((m: any) => m._id.toString() === milestoneId);
    const availableIds = contract.milestones.map((m: any) => m._id.toString());
    
    console.log('  - Is freelancer:', isFreelancer);
    console.log('  - Contract status:', contract.status);
    console.log('  - Milestone found:', !!ms);
    console.log('  - Milestone status:', ms?.status);
    console.log('  - Requested milestone ID:', milestoneId);
    console.log('  - Available milestone IDs:', availableIds);
    
    // Provide specific error messages
    if (!isFreelancer) {
      return next(new AppError('Only the freelancer can submit milestones', 403));
    }
    if (contract.status !== 'active') {
      return next(new AppError(`Contract must be active to submit milestones. Current status: ${contract.status}`, 400));
    }
    if (!ms) {
      return next(new AppError(`Milestone not found. The milestone ID "${milestoneId}" does not exist in this contract. Please refresh the page and try again.`, 404));
    }
    if (!['pending', 'in_progress', 'rejected'].includes(ms?.status || '')) {
      return next(new AppError(`Cannot submit milestone with status "${ms?.status}". Only pending, in_progress, or rejected milestones can be submitted.`, 400));
    }
    return next(new AppError('You cannot submit this milestone', 403));
  }

  const milestone = contract.milestones.find((m: any) => m._id.toString() === milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  console.log('[SUBMIT MILESTONE] Before update - milestone status:', milestone.status);

  // Update milestone
  milestone.status = 'submitted';
  milestone.submittedAt = new Date();
  milestone.freelancerNotes = freelancerNotes;

  console.log('[SUBMIT MILESTONE] After update - milestone status:', milestone.status);

  // Add deliverables
  if (deliverables && deliverables.length > 0) {
    deliverables.forEach((deliverable: any) => {
      milestone.deliverables.push({
        ...deliverable,
        milestone: milestoneId,
        status: 'submitted',
        submittedAt: new Date(),
      });
    });
  }

  await contract.save();
  console.log('[SUBMIT MILESTONE] Contract saved');

  // Repopulate contract to get updated data
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  // Send notification to client
  try {
    const freelancer = await User.findById(req.user._id);
    const freelancerName = `${freelancer?.profile.firstName} ${freelancer?.profile.lastName}`;
    // Extract client ID using helper function
    const clientId = extractUserId(contract.client);
    if (!clientId) {
      console.error('[SUBMIT_MILESTONE] Failed to extract client ID from contract:', contract._id);
      throw new Error('Could not extract client ID - notification not sent');
    }
    await notificationService.notifyMilestoneSubmitted(
      clientId,
      freelancerName,
      contract._id.toString(),
      milestone.title
    );
  } catch (error) {
    console.error('Failed to send milestone submission notification:', error);
  }

  res.json({
    status: 'success',
    message: 'Milestone submitted successfully',
    data: {
      contract,
      milestone,
    },
  });
});

export const approveMilestone = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, milestoneId } = req.params;
  const { clientFeedback } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (!contract.canApproveMilestone(milestoneId, userId.toString())) {
    return next(new AppError('You cannot approve this milestone', 403));
  }

  const milestone = contract.milestones.find((m: any) => m._id.toString() === milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  // Update milestone
  milestone.status = 'approved';
  milestone.approvedAt = new Date();
  milestone.clientFeedback = clientFeedback;

  // Approve all deliverables
  milestone.deliverables.forEach((deliverable: any) => {
    if (deliverable.status === 'submitted') {
      deliverable.status = 'approved';
      deliverable.approvedAt = new Date();
    }
  });

  await contract.save();

  // Repopulate contract to get updated data
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  // Send notification to freelancer
  try {
    const client = await User.findById(req.user._id);
    const clientName = `${client?.profile.firstName} ${client?.profile.lastName}`;
    // Extract freelancer ID using helper function
    const freelancerId = extractUserId(contract.freelancer);
    if (!freelancerId) {
      throw new Error('Could not extract freelancer ID');
    }
    await notificationService.notifyMilestoneApproved(
      freelancerId,
      clientName,
      contract._id.toString(),
      milestone.title
    );
  } catch (error) {
    console.error('Failed to send milestone approval notification:', error);
  }

  res.json({
    status: 'success',
    message: 'Milestone approved successfully',
    data: {
      contract,
      milestone,
    },
  });
});

export const rejectMilestone = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, milestoneId } = req.params;
  const { clientFeedback } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (!contract.canApproveMilestone(milestoneId, userId.toString())) {
    return next(new AppError('You cannot reject this milestone', 403));
  }

  const milestone = contract.milestones.find((m: any) => m._id.toString() === milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  // Update milestone
  milestone.status = 'rejected';
  milestone.rejectedAt = new Date();
  milestone.clientFeedback = clientFeedback;

  // Reject all deliverables
  milestone.deliverables.forEach((deliverable: any) => {
    if (deliverable.status === 'submitted') {
      deliverable.status = 'rejected';
      deliverable.rejectedAt = new Date();
      deliverable.clientFeedback = clientFeedback;
    }
  });

  await contract.save();

  // Repopulate contract to get updated data
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  res.json({
    status: 'success',
    message: 'Milestone rejected',
    data: {
      contract,
      milestone,
    },
  });
});

export const proposeAmendment = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { type, description, changes, reason } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const isParticipant = [contract.client.toString(), contract.freelancer.toString()]
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to propose amendments to this contract', 403));
  }

  if (contract.status !== 'active') {
    return next(new AppError('Amendments can only be proposed for active contracts', 400));
  }

  const amendment = {
    type,
    description,
    proposedBy: req.user._id,
    changes,
    reason,
    status: 'pending',
  };

  contract.amendments.push(amendment as any);
  await contract.save();

  res.json({
    status: 'success',
    message: 'Amendment proposed successfully',
    data: {
      amendment: contract.amendments[contract.amendments.length - 1],
    },
  });
});

export const respondToAmendment = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, amendmentId } = req.params;
  const { status, responseNotes } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  const amendment = contract.amendments.find((a: any) => a._id.toString() === amendmentId);
  if (!amendment) {
    return next(new AppError('Amendment not found', 404));
  }

  // Check if user is the other party (not the proposer)
  const otherParty = amendment.proposedBy.toString() === contract.client.toString() 
    ? contract.freelancer.toString() 
    : contract.client.toString();

  if (req.user._id.toString() !== otherParty) {
    return next(new AppError('You are not authorized to respond to this amendment', 403));
  }

  if (amendment.status !== 'pending') {
    return next(new AppError('Amendment has already been responded to', 400));
  }

  // Update amendment
  amendment.status = status;
  amendment.respondedAt = new Date();
  amendment.respondedBy = req.user._id;
  amendment.responseNotes = responseNotes;

  // If accepted, apply the changes
  if (status === 'accepted') {
    // Apply changes based on amendment type
    switch (amendment.type) {
      case 'milestone_change':
        // Update milestones
        if (amendment.changes.milestones) {
          contract.milestones = amendment.changes.milestones;
        }
        break;
      case 'timeline_change':
        // Update timeline
        if (amendment.changes.endDate) {
          contract.endDate = new Date(amendment.changes.endDate);
        }
        break;
      case 'amount_change':
        // Update total amount
        if (amendment.changes.totalAmount) {
          contract.totalAmount = amendment.changes.totalAmount;
        }
        break;
      case 'terms_change':
        // Update terms
        if (amendment.changes.terms) {
          contract.terms = { ...contract.terms, ...amendment.changes.terms };
        }
        break;
    }
  }

  await contract.save();

  res.json({
    status: 'success',
    message: `Amendment ${status} successfully`,
    data: {
      amendment,
    },
  });
});

export const cancelContract = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const isParticipant = [contract.client.toString(), contract.freelancer.toString()]
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to cancel this contract', 403));
  }

  if (!['draft', 'active'].includes(contract.status)) {
    return next(new AppError('Contract cannot be cancelled in current status', 400));
  }

  contract.status = 'cancelled';
  
  // Add cancellation amendment for record keeping
  contract.amendments.push({
    type: 'scope_change',
    description: 'Contract cancellation',
    proposedBy: req.user._id,
    changes: { status: 'cancelled' },
    reason: reason || 'Contract cancelled by user',
    status: 'accepted',
    respondedAt: new Date(),
    respondedBy: req.user._id,
  } as any);

  await contract.save();

  // Clear cache
  await deleteCache('contracts:*');

  res.json({
    status: 'success',
    message: 'Contract cancelled successfully',
  });
});

export const createDispute = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason, description, evidence } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const isParticipant = [contract.client.toString(), contract.freelancer.toString()]
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to create a dispute for this contract', 403));
  }

  if (contract.status === 'disputed') {
    return next(new AppError('Contract is already in dispute', 400));
  }

  // Update contract status to disputed
  contract.status = 'disputed';

  // Add dispute amendment for record keeping
  contract.amendments.push({
    type: 'scope_change',
    description: `Dispute created: ${description}`,
    proposedBy: req.user._id,
    changes: { 
      status: 'disputed',
      disputeReason: reason,
      evidence: evidence,
    },
    reason: reason,
    status: 'pending',
  } as any);

  await contract.save();

  // Send notification to other party
  try {
    // Extract IDs using helper function
    const clientId = extractUserId(contract.client);
    const freelancerId = extractUserId(contract.freelancer);
    
    if (!clientId || !freelancerId) {
      throw new Error('Could not extract user IDs');
    }
    
    const otherPartyId = clientId === req.user._id.toString() 
      ? freelancerId 
      : clientId;
    
    const user = await User.findById(req.user._id);
    const userName = `${user?.profile.firstName} ${user?.profile.lastName}`;
    
    await notificationService.notifyContractDispute(
      otherPartyId,
      userName,
      contract._id.toString(),
      reason
    );
  } catch (error) {
    console.error('Failed to send dispute notification:', error);
  }

  res.json({
    status: 'success',
    message: 'Dispute created successfully',
    data: {
      contract,
    },
  });
});

export const pauseContract = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const isParticipant = [contract.client.toString(), contract.freelancer.toString()]
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to pause this contract', 403));
  }

  if (contract.status !== 'active') {
    return next(new AppError('Only active contracts can be paused', 400));
  }

  contract.status = 'paused';

  // Add pause amendment for record keeping
  contract.amendments.push({
    type: 'scope_change',
    description: 'Contract paused',
    proposedBy: req.user._id,
    changes: { status: 'paused' },
    reason: reason || 'Contract paused by user',
    status: 'accepted',
    respondedAt: new Date(),
    respondedBy: req.user._id,
  } as any);

  await contract.save();

  res.json({
    status: 'success',
    message: 'Contract paused successfully',
    data: {
      contract,
    },
  });
});

export const resumeContract = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is part of the contract
  const isParticipant = [contract.client.toString(), contract.freelancer.toString()]
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return next(new AppError('You are not authorized to resume this contract', 403));
  }

  if (contract.status !== 'paused') {
    return next(new AppError('Only paused contracts can be resumed', 400));
  }

  contract.status = 'active';

  // Add resume amendment for record keeping
  contract.amendments.push({
    type: 'scope_change',
    description: 'Contract resumed',
    proposedBy: req.user._id,
    changes: { status: 'active' },
    reason: 'Contract resumed by user',
    status: 'accepted',
    respondedAt: new Date(),
    respondedBy: req.user._id,
  } as any);

  await contract.save();

  res.json({
    status: 'success',
    message: 'Contract resumed successfully',
    data: {
      contract,
    },
  });
});


export const releasePayment = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, milestoneId } = req.params;

  const contract = await Contract.findById(id);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  // Only client can release payment
  if (contract.client.toString() !== userId.toString()) {
    return next(new AppError('Only the client can release payment', 403));
  }

  const milestone = contract.milestones.find((m: any) => m._id.toString() === milestoneId);
  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  // Can only release payment for approved milestones
  if (milestone.status !== 'approved') {
    return next(new AppError('Payment can only be released for approved milestones', 400));
  }

  // Update milestone status to paid
  milestone.status = 'paid';
  milestone.paidAt = new Date();

  // Check if all milestones are paid - if so, complete the contract
  const allMilestonesPaid = contract.milestones.every((m: any) => m.status === 'paid');
  if (allMilestonesPaid) {
    contract.status = 'completed';
  }

  await contract.save();

  // Repopulate contract
  await contract.populate([
    { path: 'client', select: 'profile' },
    { path: 'freelancer', select: 'profile freelancerProfile' },
    { path: 'project', select: 'title' },
  ]);

  // Send notification to freelancer
  try {
    const client = await User.findById(userId);
    const clientName = `${client?.profile.firstName} ${client?.profile.lastName}`;
    // Extract freelancer ID using helper function
    const freelancerId = extractUserId(contract.freelancer);
    if (!freelancerId) {
      throw new Error('Could not extract freelancer ID');
    }
    await notificationService.notifyPaymentReleased(
      freelancerId,
      clientName,
      contract._id.toString(),
      milestone.title,
      milestone.amount
    );
  } catch (error) {
    console.error('Failed to send payment notification:', error);
  }

  res.json({
    status: 'success',
    message: allMilestonesPaid 
      ? 'Payment released! All milestones complete - contract is now finished.' 
      : 'Payment released successfully',
    data: {
      contract,
      milestone,
      contractCompleted: allMilestonesPaid,
    },
  });
});
