import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { HireNowRequest } from '@/models/HireNowRequest';
import { Contract } from '@/models/Contract';
import { Project } from '@/models/Project';
import { Notification } from '@/models/Notification';
import { Category } from '@/models/Category';
import { AppError } from '@/middleware/errorHandler';
import { sendEmail } from '@/utils/email.resend';
import { User } from '@/models/User';

/**
 * Create a hire now request
 */
export const createHireNowRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { freelancerId } = req.params;
    const clientId = req.user!._id;
    const {
      projectTitle,
      projectDescription,
      budget,
      timeline,
      milestones,
      message,
    } = req.body;

    console.log(`[HIRE NOW SEND] Client ${clientId} sending request to freelancer ${freelancerId}`);
    console.log(`[HIRE NOW SEND] Project: ${projectTitle}, Budget: ${budget}`);

    // Validate freelancer exists
    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== 'freelancer') {
      console.log(`[HIRE NOW SEND ERROR] Freelancer not found: ${freelancerId}`);
      return next(new AppError('Freelancer not found', 404));
    }

    console.log(`[HIRE NOW SEND] Freelancer found: ${freelancer.profile.firstName} ${freelancer.profile.lastName}`);

    // Create hire now request
    const hireNowRequest = await HireNowRequest.create({
      client: clientId,
      freelancer: freelancerId,
      projectTitle,
      projectDescription,
      budget,
      timeline,
      milestones: milestones || [],
      message,
      status: 'pending',
    });

    console.log(`[HIRE NOW SEND] Request created: ${hireNowRequest._id}`);

    // Populate freelancer details
    await hireNowRequest.populate('freelancer', 'profile email');

    // Create in-app notification for freelancer
    try {
      await Notification.create({
        user: freelancerId,
        type: 'system',
        title: `New Hire Now Request: ${projectTitle}`,
        message: `You have received a new hire now request for "${projectTitle}" with a budget of ${budget}`,
        link: '/dashboard/hire-now-requests',
        priority: 'high',
        metadata: {
          senderId: clientId,
          amount: budget,
        },
        isRead: false,
      });
    } catch (notificationError) {
      console.error('Failed to create hire now notification:', notificationError);
    }

    // Send email notification to freelancer
    try {
      await sendEmail({
        to: (hireNowRequest.freelancer as any).email,
        subject: `New Hire Now Request: ${projectTitle}`,
        html: `
          <h2>You have a new Hire Now request!</h2>
          <p><strong>Project:</strong> ${projectTitle}</p>
          <p><strong>Budget:</strong> $${budget}</p>
          <p><strong>Timeline:</strong> ${timeline.duration} ${timeline.unit}</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p>Log in to your dashboard to review and respond to this request.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send hire now notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      data: hireNowRequest,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to create hire now request', 500));
  }
};

/**
 * Get hire now requests sent by client
 */
export const getSentRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requests = await HireNowRequest.findByClient(req.user!._id.toString());

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch sent requests', 500));
  }
};

/**
 * Get hire now requests received by freelancer
 */
export const getReceivedRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const freelancerId = req.user!._id.toString();
    console.log(`[HIRE NOW RECEIVED] Fetching requests for freelancer: ${freelancerId}`);
    
    const requests = await HireNowRequest.findByFreelancer(freelancerId);
    
    console.log(`[HIRE NOW RECEIVED] Found ${requests.length} requests`);
    console.log(`[HIRE NOW RECEIVED] Requests:`, requests);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to fetch received requests', 500));
  }
};

/**
 * Accept a hire now request
 */
export const acceptHireNowRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;

    console.log(`[HIRE NOW ACCEPT] ========== START ACCEPT ==========`);
    console.log(`[HIRE NOW ACCEPT] Request ID: ${id}`);
    console.log(`[HIRE NOW ACCEPT] User ID: ${req.user!._id}`);

    const hireNowRequest = await HireNowRequest.findById(id)
      .populate('client', 'profile email')
      .populate('freelancer', 'profile email');

    if (!hireNowRequest) {
      console.log(`[HIRE NOW ACCEPT ERROR] Request not found: ${id}`);
      return next(new AppError('Hire now request not found', 404));
    }

    console.log(`[HIRE NOW ACCEPT] Request found:`, {
      id: hireNowRequest._id,
      projectTitle: hireNowRequest.projectTitle,
      budget: hireNowRequest.budget,
      status: hireNowRequest.status,
    });

    // Verify the freelancer is accepting their own request
    if (hireNowRequest.freelancer._id.toString() !== req.user!._id.toString()) {
      console.log(`[HIRE NOW ACCEPT ERROR] Unauthorized - freelancer mismatch`);
      return next(new AppError('Not authorized to accept this request', 403));
    }

    if (hireNowRequest.status !== 'pending') {
      console.log(`[HIRE NOW ACCEPT ERROR] Request already responded - status: ${hireNowRequest.status}`);
      return next(new AppError('Request has already been responded to', 400));
    }

    console.log(`[HIRE NOW ACCEPT] Accepting request...`);
    // Accept the request
    await hireNowRequest.accept(responseMessage);

    // Get a default category - MUST be a valid ObjectId
    const defaultCategory = await Category.findOne({});
    if (!defaultCategory) {
      console.log(`[HIRE NOW ACCEPT ERROR] No categories found in database`);
      return next(new AppError('System configuration error: No categories available', 500));
    }
    console.log(`[HIRE NOW ACCEPT] Using category: ${defaultCategory.name} (${defaultCategory._id})`);

    // Create project
    const project = await Project.create({
      title: hireNowRequest.projectTitle,
      description: hireNowRequest.projectDescription,
      client: hireNowRequest.client._id,
      category: defaultCategory._id,
      skills: [],
      budget: {
        type: 'fixed',
        min: hireNowRequest.budget,
        max: hireNowRequest.budget,
      },
      timeline: hireNowRequest.timeline,
      status: 'in_progress',
      selectedFreelancer: hireNowRequest.freelancer._id,
    });

    // Create a dummy proposal for the contract (required field)
    const Proposal = (await import('@/models/Proposal')).Proposal;
    // Ensure cover letter is at least 50 characters
    const coverLetterBase = `Direct hire request accepted for project "${hireNowRequest.projectTitle}". `;
    const coverLetterDesc = hireNowRequest.projectDescription || 'Project details as discussed.';
    const coverLetter = coverLetterBase + coverLetterDesc;
    
    const dummyProposal = await Proposal.create({
      project: project._id,
      freelancer: hireNowRequest.freelancer._id,
      coverLetter: coverLetter.length >= 50 ? coverLetter : coverLetter.padEnd(50, ' '),
      bidAmount: hireNowRequest.budget,
      timeline: hireNowRequest.timeline,
      milestones: hireNowRequest.milestones.length > 0 ? hireNowRequest.milestones : [{
        title: 'Project Completion',
        description: 'Complete the project as described',
        amount: hireNowRequest.budget,
        dueDate: new Date(Date.now() + (hireNowRequest.timeline.duration * (hireNowRequest.timeline.unit === 'days' ? 1 : hireNowRequest.timeline.unit === 'weeks' ? 7 : 30) * 24 * 60 * 60 * 1000)),
      }],
      status: 'accepted',
    });

    // Calculate end date based on timeline
    const timelineMultiplier = hireNowRequest.timeline.unit === 'days' ? 1 : hireNowRequest.timeline.unit === 'weeks' ? 7 : 30;
    const endDate = new Date(Date.now() + (hireNowRequest.timeline.duration * timelineMultiplier * 24 * 60 * 60 * 1000));

    // Create contract with proper terms object
    console.log(`[HIRE NOW ACCEPT] Creating contract for hire now request: ${id}`);
    
    const contractMilestones = hireNowRequest.milestones.length > 0 
      ? hireNowRequest.milestones.map((m: any) => ({
          _id: new mongoose.Types.ObjectId(),
          title: m.title,
          description: m.description || 'Milestone delivery',
          amount: m.amount,
          dueDate: m.dueDate || endDate,
          status: 'pending',
        }))
      : [{
          _id: new mongoose.Types.ObjectId(),
          title: 'Project Completion',
          description: 'Complete the project as described',
          amount: hireNowRequest.budget,
          dueDate: endDate,
          status: 'pending',
        }];

    const contract = await Contract.create({
      project: project._id,
      client: hireNowRequest.client._id,
      freelancer: hireNowRequest.freelancer._id,
      proposal: dummyProposal._id,
      title: hireNowRequest.projectTitle,
      description: hireNowRequest.projectDescription,
      totalAmount: hireNowRequest.budget,
      currency: 'USD',
      startDate: new Date(),
      endDate: endDate,
      status: 'active',
      sourceType: 'hire_now',
      hireNowRequest: hireNowRequest._id,
      milestones: contractMilestones,
      terms: {
        paymentTerms: 'Payment will be released upon milestone completion and client approval.',
        cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
        intellectualProperty: 'All work product created under this contract will be owned by the client.',
        confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
        disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
      },
    });

    console.log(`[HIRE NOW ACCEPT] Contract created successfully: ${contract._id}`);

    // Create in-app notification for client
    try {
      await Notification.create({
        user: hireNowRequest.client._id,
        type: 'contract',
        title: `Hire Now Request Accepted: ${hireNowRequest.projectTitle}`,
        message: `${(hireNowRequest.freelancer as any).profile.firstName} ${(hireNowRequest.freelancer as any).profile.lastName} has accepted your hire now request. Contract created.`,
        link: `/dashboard/contracts/${contract._id}`,
        priority: 'high',
        metadata: {
          contractId: contract._id,
          senderId: hireNowRequest.freelancer._id,
          amount: hireNowRequest.budget,
        },
        isRead: false,
      });
    } catch (notificationError) {
      console.error('Failed to create acceptance notification:', notificationError);
    }

    // Send email notification to client
    try {
      await sendEmail({
        to: (hireNowRequest.client as any).email,
        subject: `Hire Now Request Accepted: ${hireNowRequest.projectTitle}`,
        html: `
          <h2>Your Hire Now request has been accepted!</h2>
          <p><strong>Project:</strong> ${hireNowRequest.projectTitle}</p>
          <p><strong>Freelancer:</strong> ${(hireNowRequest.freelancer as any).profile.firstName} ${(hireNowRequest.freelancer as any).profile.lastName}</p>
          ${responseMessage ? `<p><strong>Message:</strong> ${responseMessage}</p>` : ''}
          <p>A contract has been created. Log in to your dashboard to view details.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send acceptance notification email:', emailError);
    }

    console.log(`[HIRE NOW ACCEPT] ✅ Success - Project and contract created`);
    console.log(`[HIRE NOW ACCEPT] Project ID: ${project._id}`);
    console.log(`[HIRE NOW ACCEPT] Contract ID: ${contract._id}`);
    console.log(`[HIRE NOW ACCEPT] ========== END ACCEPT ==========`);

    res.status(200).json({
      success: true,
      data: {
        hireNowRequest,
        project,
        contract,
      },
    });
  } catch (error: any) {
    console.error(`[HIRE NOW ACCEPT ERROR] ❌ Error:`, error.message);
    console.error(`[HIRE NOW ACCEPT ERROR] Stack:`, error.stack);
    next(new AppError(error.message || 'Failed to accept hire now request', 500));
  }
};

/**
 * Reject a hire now request
 */
export const rejectHireNowRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;

    const hireNowRequest = await HireNowRequest.findById(id)
      .populate('client', 'profile email')
      .populate('freelancer', 'profile email');

    if (!hireNowRequest) {
      return next(new AppError('Hire now request not found', 404));
    }

    // Verify the freelancer is rejecting their own request
    if (hireNowRequest.freelancer._id.toString() !== req.user!._id.toString()) {
      return next(new AppError('Not authorized to reject this request', 403));
    }

    if (hireNowRequest.status !== 'pending') {
      return next(new AppError('Request has already been responded to', 400));
    }

    // Reject the request
    await hireNowRequest.reject(responseMessage);

    // Create in-app notification for client
    try {
      await Notification.create({
        user: hireNowRequest.client._id,
        type: 'system',
        title: `Hire Now Request Declined: ${hireNowRequest.projectTitle}`,
        message: `${(hireNowRequest.freelancer as any).profile.firstName} ${(hireNowRequest.freelancer as any).profile.lastName} has declined your hire now request.`,
        link: '/dashboard/hire-now-requests',
        priority: 'normal',
        metadata: {
          senderId: hireNowRequest.freelancer._id,
        },
        isRead: false,
      });
    } catch (notificationError) {
      console.error('Failed to create rejection notification:', notificationError);
    }

    // Send email notification to client
    try {
      await sendEmail({
        to: (hireNowRequest.client as any).email,
        subject: `Hire Now Request Declined: ${hireNowRequest.projectTitle}`,
        html: `
          <h2>Your Hire Now request has been declined</h2>
          <p><strong>Project:</strong> ${hireNowRequest.projectTitle}</p>
          <p><strong>Freelancer:</strong> ${(hireNowRequest.freelancer as any).profile.firstName} ${(hireNowRequest.freelancer as any).profile.lastName}</p>
          ${responseMessage ? `<p><strong>Message:</strong> ${responseMessage}</p>` : ''}
          <p>You can browse other freelancers or post your project to receive proposals.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send rejection notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      data: hireNowRequest,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to reject hire now request', 500));
  }
};



