import { Request, Response } from 'express';
import ServicePackage from '@/models/ServicePackage';
import ProjectTemplate from '@/models/ProjectTemplate';
import PreferredVendor from '@/models/PreferredVendor';
import { Project } from '@/models/Project';
import { logger } from '@/utils/logger';

// Create service package
export const createServicePackage = async (req: Request, res: Response) => {
  try {
    const freelancerId = req.user._id;
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
    if (freelancerId) query.freelancer = freelancerId;
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
    const freelancerId = req.user._id;

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
    const clientId = req.user._id;
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
    const userId = req.user._id;

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
    const clientId = req.user._id;

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

    // Create project from template
    const project = await Project.create({
      title: template.title,
      description: template.description,
      category: template.category,
      budget: template.budget,
      duration: template.duration,
      skills: template.skills,
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
    const clientId = req.user._id;
    const { freelancerId, category, rating, notes, isPriority } = req.body;

    const vendor = await PreferredVendor.create({
      client: clientId,
      freelancer: freelancerId,
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
    const clientId = req.user._id;
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
    const clientId = req.user._id;

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
    const clientId = req.user._id;

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
