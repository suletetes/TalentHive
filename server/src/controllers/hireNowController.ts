import { Request, Response, NextFunction } from 'express';
import { HireNowRequest } from '@/models/HireNowRequest';
import { Contract } from '@/models/Contract';
import { Project } from '@/models/Project';
import { AppError } from '@/middleware/errorHandler';
import { emailService } from '@/services/email.service';
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
    const {
      projectTitle,
      projectDescription,
      budget,
      timeline,
      milestones,
      message,
    } = req.body;

    // Validate freelancer exists
    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== 'freelancer') {
      return next(new AppError('Freelancer not found', 404));
    }

    // Create hire now request
    const hireNowRequest = await HireNowRequest.create({
      client: req.user!._id,
      freelancer: freelancerId,
      projectTitle,
      projectDescription,
      budget,
      timeline,
      milestones: milestones || [],
      message,
      status: 'pending',
    });

    // Populate freelancer details
    await hireNowRequest.populate('freelancer', 'profile email');

    // Send email notification to freelancer
    try {
      await emailService.sendEmail({
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
    const requests = await HireNowRequest.findByFreelancer(req.user!._id.toString());

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

    const hireNowRequest = await HireNowRequest.findById(id)
      .populate('client', 'profile email')
      .populate('freelancer', 'profile email');

    if (!hireNowRequest) {
      return next(new AppError('Hire now request not found', 404));
    }

    // Verify the freelancer is accepting their own request
    if (hireNowRequest.freelancer._id.toString() !== req.user!._id.toString()) {
      return next(new AppError('Not authorized to accept this request', 403));
    }

    if (hireNowRequest.status !== 'pending') {
      return next(new AppError('Request has already been responded to', 400));
    }

    // Accept the request
    await hireNowRequest.accept(responseMessage);

    // Create project
    const project = await Project.create({
      title: hireNowRequest.projectTitle,
      description: hireNowRequest.projectDescription,
      client: hireNowRequest.client._id,
      category: 'General', // Default category
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

    // Create contract
    const contract = await Contract.create({
      project: project._id,
      client: hireNowRequest.client._id,
      freelancer: hireNowRequest.freelancer._id,
      title: hireNowRequest.projectTitle,
      description: hireNowRequest.projectDescription,
      budget: hireNowRequest.budget,
      timeline: hireNowRequest.timeline,
      milestones: hireNowRequest.milestones.map((m: any) => ({
        title: m.title,
        description: m.description,
        amount: m.amount,
        dueDate: m.dueDate,
        status: 'pending',
      })),
      status: 'active',
      startDate: new Date(),
    });

    // Send email notification to client
    try {
      await emailService.sendEmail({
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

    res.status(200).json({
      success: true,
      data: {
        hireNowRequest,
        project,
        contract,
      },
    });
  } catch (error: any) {
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

    // Send email notification to client
    try {
      await emailService.sendEmail({
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
