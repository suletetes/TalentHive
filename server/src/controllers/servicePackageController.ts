import { Request, Response } from 'express';
import ServicePackage from '@/models/ServicePackage';
import ProjectTemplate from '@/models/ProjectTemplate';
import PreferredVendor from '@/models/PreferredVendor';
import { Project } from '@/models/Project';
import { Contract } from '@/models/Contract';
import { Proposal } from '@/models/Proposal';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { sendEmail } from '@/utils/email.resend';

// Create service package
export const createServicePackage = async (req: Request, res: Response) => {
  try {
    const freelancerId = req.user?._id;
    if (!freelancerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }
    const packageData = { ...req.body, freelancer: freelancerId };

    const servicePackage = await ServicePackage.create(packageData);

    res.status(201).json({
      status: 'success',
      data: { servicePackage },
    });
  } catch (error) {
    logger.error('Error creating service package:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create service package',
    });
  }
};

// Get service packages
export const getServicePackages = async (req: Request, res: Response) => {
  try {
    const { category, freelancerId, search } = req.query;
    const query: any = { isActive: true };

    if (category) query.category = category;
    
    // Handle freelancerId - could be ObjectId or slug
    if (freelancerId) {
      const { resolveUserIdBySlugOrId } = await import('@/utils/userResolver');
      const resolvedUserId = await resolveUserIdBySlugOrId(freelancerId as string);
      
      if (resolvedUserId) {
        query.freelancer = resolvedUserId;
      } else {
        // No user found with this slug/ID, return empty results
        return res.json({
          status: 'success',
          results: 0,
          data: { packages: [] },
        });
      }
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const packages = await ServicePackage.find(query)
      .populate('freelancer', 'firstName lastName profilePicture rating')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      results: packages.length,
      data: { packages },
    });
  } catch (error) {
    logger.error('Error fetching service packages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch service packages',
    });
  }
};

// Update service package
export const updateServicePackage = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const freelancerId = req.user?._id;
    if (!freelancerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const servicePackage = await ServicePackage.findOne({
      _id: packageId,
      freelancer: freelancerId,
    });

    if (!servicePackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Service package not found',
      });
    }

    Object.assign(servicePackage, req.body);
    await servicePackage.save();

    res.json({
      status: 'success',
      data: { servicePackage },
    });
  } catch (error) {
    logger.error('Error updating service package:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update service package',
    });
  }
};

// Create project template
export const createProjectTemplate = async (req: Request, res: Response) => {
  try {
    const clientId = req.user?._id;
    if (!clientId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }
    const templateData = { ...req.body, client: clientId };

    const template = await ProjectTemplate.create(templateData);

    res.status(201).json({
      status: 'success',
      data: { template },
    });
  } catch (error) {
    logger.error('Error creating project template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create project template',
    });
  }
};

// Get project templates
export const getProjectTemplates = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const templates = await ProjectTemplate.find({ client: userId })
      .populate('preferredVendors', 'firstName lastName profilePicture rating')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      results: templates.length,
      data: { templates },
    });
  } catch (error) {
    logger.error('Error fetching project templates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project templates',
    });
  }
};

// Create project from template
export const createProjectFromTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const clientId = req.user?._id;
    if (!clientId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const template = await ProjectTemplate.findOne({
      _id: templateId,
      client: clientId,
    });

    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found',
      });
    }

    // Import Category and Skill models
    const { Category } = await import('@/models/Category');
    const { Skill } = await import('@/models/Skill');

    // Find or create category
    let category = await Category.findOne({ name: template.category });
    if (!category) {
      category = await Category.create({
        name: template.category,
        slug: template.category.toLowerCase().replace(/\s+/g, '-'),
        description: `Category for ${template.category}`,
        createdBy: clientId,
      });
    }

    // Find or create skills
    const skillObjects = [];
    for (const skillName of template.skills || []) {
      let skill = await Skill.findOne({ name: skillName });
      if (!skill) {
        skill = await Skill.create({
          name: skillName,
          slug: skillName.toLowerCase().replace(/\s+/g, '-'),
          category: category._id,
          createdBy: clientId,
        });
      }
      skillObjects.push(skill._id);
    }

    // Create project from template
    const project = await Project.create({
      title: template.title,
      description: template.description,
      category: category._id,
      budget: {
        type: 'fixed',
        min: template.budget.min,
        max: template.budget.max,
      },
      timeline: {
        duration: template.duration,
        unit: 'days',
      },
      skills: skillObjects,
      requirements: template.requirements,
      client: clientId,
      status: 'open',
    });

    // Increment usage count
    template.usageCount += 1;
    await template.save();

    res.status(201).json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    logger.error('Error creating project from template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create project from template',
    });
  }
};

// Add preferred vendor
export const addPreferredVendor = async (req: Request, res: Response) => {
  try {
    const clientId = req.user?._id;
    if (!clientId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }
    const { freelancerId, category, rating, notes, isPriority } = req.body;

    // Resolve freelancer slug or ID to ObjectId
    const { resolveUserIdBySlugOrId } = await import('@/utils/userResolver');
    const resolvedFreelancerId = await resolveUserIdBySlugOrId(freelancerId);
    
    if (!resolvedFreelancerId) {
      return res.status(404).json({
        status: 'error',
        message: 'Freelancer not found',
      });
    }

    const vendor = await PreferredVendor.create({
      client: clientId,
      freelancer: resolvedFreelancerId,
      category,
      rating,
      notes,
      isPriority,
    });

    res.status(201).json({
      status: 'success',
      data: { vendor },
    });
  } catch (error: any) {
    logger.error('Error adding preferred vendor:', error);
    res.status(500).json({
      status: 'error',
      message: error.code === 11000 ? 'Vendor already in preferred list' : 'Failed to add preferred vendor',
    });
  }
};

// Get preferred vendors
export const getPreferredVendors = async (req: Request, res: Response) => {
  try {
    const clientId = req.user?._id;
    if (!clientId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }
    const { category } = req.query;

    const query: any = { client: clientId };
    if (category) query.category = category;

    const vendors = await PreferredVendor.find(query)
      .populate('freelancer', 'firstName lastName profilePicture rating skills')
      .sort({ isPriority: -1, rating: -1 });

    res.json({
      status: 'success',
      results: vendors.length,
      data: { vendors },
    });
  } catch (error) {
    logger.error('Error fetching preferred vendors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch preferred vendors',
    });
  }
};

// Update preferred vendor
export const updatePreferredVendor = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const clientId = req.user?._id;
    if (!clientId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const vendor = await PreferredVendor.findOne({
      _id: vendorId,
      client: clientId,
    });

    if (!vendor) {
      return res.status(404).json({
        status: 'error',
        message: 'Preferred vendor not found',
      });
    }

    Object.assign(vendor, req.body);
    await vendor.save();

    res.json({
      status: 'success',
      data: { vendor },
    });
  } catch (error) {
    logger.error('Error updating preferred vendor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update preferred vendor',
    });
  }
};

// Remove preferred vendor
export const removePreferredVendor = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const clientId = req.user?._id;
    if (!clientId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const result = await PreferredVendor.deleteOne({
      _id: vendorId,
      client: clientId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Preferred vendor not found',
      });
    }

    res.json({
      status: 'success',
      message: 'Preferred vendor removed',
    });
  } catch (error) {
    logger.error('Error removing preferred vendor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove preferred vendor',
    });
  }
};

// Order a service package (creates project and contract)
export const orderServicePackage = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const clientId = req.user?._id;
    const { requirements, message } = req.body;

    if (!clientId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    console.log(`[SERVICE ORDER] Client ${clientId} ordering package ${packageId}`);

    // Get the service package
    const servicePackage = await ServicePackage.findById(packageId);
    if (!servicePackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Service package not found',
      });
    }

    if (!servicePackage.isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'This service package is not available',
      });
    }

    // Get freelancer details
    const freelancer = await User.findById(servicePackage.freelancer);
    if (!freelancer) {
      return res.status(404).json({
        status: 'error',
        message: 'Freelancer not found',
      });
    }

    // Get client details
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found',
      });
    }

    // Calculate price and end date
    const price = servicePackage.pricing.amount || servicePackage.pricing.hourlyRate || 0;
    const deliveryDays = servicePackage.deliveryTime;
    const endDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);

    console.log(`[SERVICE ORDER] Package: ${servicePackage.title}, Price: $${price}, Delivery: ${deliveryDays} days`);

    // Create project
    // Note: servicePackage.skills contains string names, not ObjectIds, so we use empty array
    const project = await Project.create({
      title: `Service: ${servicePackage.title}`,
      description: servicePackage.description + (requirements ? `\n\nClient Requirements: ${requirements}` : ''),
      client: clientId,
      category: servicePackage.category || 'General',
      skills: [],
      budget: {
        type: 'fixed',
        min: price,
        max: price,
      },
      timeline: {
        duration: deliveryDays,
        unit: 'days',
      },
      status: 'in_progress',
      selectedFreelancer: servicePackage.freelancer,
    });

    console.log(`[SERVICE ORDER] Project created: ${project._id}`);

    // Create a proposal for the contract (required field)
    const proposal = await Proposal.create({
      project: project._id,
      freelancer: servicePackage.freelancer,
      coverLetter: `Service package order: ${servicePackage.title}\n\n${servicePackage.description}`,
      bidAmount: price,
      timeline: {
        duration: deliveryDays,
        unit: 'days',
      },
      milestones: [{
        title: 'Service Delivery',
        description: `Complete delivery of ${servicePackage.title}`,
        amount: price,
        dueDate: endDate,
      }],
      status: 'accepted',
    });

    console.log(`[SERVICE ORDER] Proposal created: ${proposal._id}`);

    // Create contract with sourceType: 'service'
    const contract = await Contract.create({
      project: project._id,
      client: clientId,
      freelancer: servicePackage.freelancer,
      proposal: proposal._id,
      title: servicePackage.title,
      description: servicePackage.description,
      totalAmount: price,
      currency: 'USD',
      startDate: new Date(),
      endDate: endDate,
      status: 'active',
      sourceType: 'service',
      servicePackage: servicePackage._id,
      milestones: [{
        title: 'Service Delivery',
        description: `Complete delivery of ${servicePackage.title}`,
        amount: price,
        dueDate: endDate,
        status: 'pending',
      }],
      terms: {
        paymentTerms: 'Payment will be released upon service completion and client approval.',
        cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
        intellectualProperty: 'All work product created under this contract will be owned by the client.',
        confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
        disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
      },
    });

    console.log(`[SERVICE ORDER] Contract created: ${contract._id}, sourceType: ${contract.sourceType}`);

    // Increment order count on service package
    servicePackage.orders = (servicePackage.orders || 0) + 1;
    await servicePackage.save();

    // Create notification for freelancer
    try {
      await Notification.create({
        user: servicePackage.freelancer,
        type: 'contract',
        title: `New Service Order: ${servicePackage.title}`,
        message: `${client.profile.firstName} ${client.profile.lastName} has ordered your service "${servicePackage.title}"`,
        link: `/dashboard/contracts/${contract._id}`,
        priority: 'high',
        metadata: {
          contractId: contract._id,
          senderId: clientId,
          amount: price,
        },
        isRead: false,
      });
    } catch (notificationError) {
      console.error('Failed to create service order notification:', notificationError);
    }

    // Send email notification to freelancer
    try {
      await sendEmail({
        to: freelancer.email,
        subject: `New Service Order: ${servicePackage.title}`,
        html: `
          <h2>You have a new service order!</h2>
          <p><strong>Service:</strong> ${servicePackage.title}</p>
          <p><strong>Client:</strong> ${client.profile.firstName} ${client.profile.lastName}</p>
          <p><strong>Amount:</strong> $${price}</p>
          <p><strong>Delivery Time:</strong> ${deliveryDays} days</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p>Log in to your dashboard to view the contract and start working.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send service order email:', emailError);
    }

    console.log(`[SERVICE ORDER] ✅ Success - Contract ${contract._id} created with sourceType: service`);

    res.status(201).json({
      status: 'success',
      message: 'Service ordered successfully',
      data: {
        project,
        contract,
        servicePackage: {
          _id: servicePackage._id,
          title: servicePackage.title,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error ordering service package:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to order service package',
    });
  }
};

// Get a single service package by ID
export const getServicePackageById = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;

    const servicePackage = await ServicePackage.findById(packageId)
      .populate('freelancer', 'profile rating freelancerProfile');

    if (!servicePackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Service package not found',
      });
    }

    // Increment view count
    servicePackage.views = (servicePackage.views || 0) + 1;
    await servicePackage.save();

    res.json({
      status: 'success',
      data: { servicePackage },
    });
  } catch (error) {
    logger.error('Error fetching service package:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch service package',
    });
  }
};
