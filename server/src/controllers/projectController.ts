import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Project } from '@/models/Project';
import { User } from '@/models/User';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { setCache, getCache, deleteCache } from '@/config/redis';

interface AuthRequest extends Request {
  user?: any;
}

export const createProjectValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
  body('budget.type').isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
  body('budget.min').isFloat({ min: 0 }).withMessage('Minimum budget must be a positive number'),
  body('budget.max').isFloat({ min: 0 }).withMessage('Maximum budget must be a positive number'),
  body('timeline.duration').isInt({ min: 1 }).withMessage('Timeline duration must be a positive integer'),
  body('timeline.unit').isIn(['days', 'weeks', 'months']).withMessage('Timeline unit must be days, weeks, or months'),
];

export const createProject = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }

  if (req.user.role !== 'client') {
    return next(new AppError('Only clients can create projects', 403));
  }

  const projectData = {
    ...req.body,
    client: req.user._id,
  };

  // Remove empty organization string
  if (!projectData.organization || projectData.organization === '') {
    delete projectData.organization;
  }

  // If organization is provided, verify user is a member
  if (projectData.organization) {
    const { Organization } = await import('@/models/Organization');
    const org = await Organization.findById(projectData.organization);
    
    if (!org) {
      return next(new AppError('Organization not found', 404));
    }

    const isMember = org.owner.toString() === req.user._id.toString() ||
      org.members.some((m: any) => m.user.toString() === req.user._id.toString());
    
    if (!isMember) {
      return next(new AppError('You are not a member of this organization', 403));
    }
  }

  // Validate budget range
  if (projectData.budget.min > projectData.budget.max) {
    return next(new AppError('Minimum budget cannot be greater than maximum budget', 400));
  }

  const project = new Project(projectData);
  await project.save();

  // If organization is linked, add project to organization
  if (projectData.organization) {
    const { Organization } = await import('@/models/Organization');
    await Organization.findByIdAndUpdate(
      projectData.organization,
      { $push: { projects: project._id } }
    );
  }

  // Update client's project count
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'clientProfile.projectsPosted': 1 },
  });

  // Clear projects cache
  await deleteCache('projects:*');

  res.status(201).json({
    status: 'success',
    message: 'Project created successfully',
    data: {
      project,
    },
  });
});

export const getProjects = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 10,
    category,
    skills,
    budgetMin,
    budgetMax,
    budgetType,
    timeline,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status = 'open',
    featured,
    urgent,
    organization,
  } = req.query;

  console.log(`[GET PROJECTS] Fetching projects with filters:`, {
    page,
    limit,
    category,
    skills,
    status,
  });

  // Build cache key
  const cacheKey = `projects:${JSON.stringify(req.query)}`;
  
  // Try to get from cache first
  const cachedResult = await getCache(cacheKey);
  if (cachedResult) {
    console.log(`[GET PROJECTS] Returning cached result`);
    return res.json({
      status: 'success',
      data: cachedResult,
    });
  }

  const query: any = {
    visibility: 'public',
    status: status || 'open',
  };

  // Add organization filter
  if (organization) {
    query.organization = organization;
  }

  // Add filters
  if (category) {
    query.category = category;
    console.log(`[GET PROJECTS] Filtering by category: ${category}`);
  }

  if (skills) {
    const skillsArray = (skills as string).split(',');
    query.skills = { $in: skillsArray };
    console.log(`[GET PROJECTS] Filtering by skills:`, skillsArray);
  }

  if (budgetMin || budgetMax) {
    query.$and = query.$and || [];
    if (budgetMin) {
      query.$and.push({ 'budget.min': { $gte: parseFloat(budgetMin as string) } });
    }
    if (budgetMax) {
      query.$and.push({ 'budget.max': { $lte: parseFloat(budgetMax as string) } });
    }
  }

  if (budgetType) {
    query['budget.type'] = budgetType;
  }

  if (timeline) {
    const [duration, unit] = (timeline as string).split('-');
    if (duration && unit) {
      query['timeline.duration'] = { $lte: parseInt(duration) };
      query['timeline.unit'] = unit;
    }
  }

  if (featured === 'true') {
    query.isFeatured = true;
  }

  if (urgent === 'true') {
    query.isUrgent = true;
  }

  // Handle search
  if (search) {
    query.$text = { $search: search as string };
  }

  // Build sort object
  const sort: any = {};
  if (search) {
    sort.score = { $meta: 'textScore' };
  }
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('client', 'profile rating clientProfile')
      .populate('organization', 'name logo budget')
      .populate('category', '_id name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string))
      .lean(),
    Project.countDocuments(query),
  ]);

  console.log(`[GET PROJECTS] Found ${projects.length} projects`);
  
  // Log first project to check data format
  if (projects.length > 0) {
    const firstProject = projects[0];
    console.log(`[GET PROJECTS] First project category type:`, typeof firstProject.category);
    console.log(`[GET PROJECTS] First project category:`, firstProject.category);
    console.log(`[GET PROJECTS] First project skills:`, firstProject.skills);
  }

  // Add proposal counts to each project
  const { Proposal } = await import('@/models/Proposal');
  const projectsWithCounts = await Promise.all(
    projects.map(async (project: any) => {
      const proposalCount = await Proposal.countDocuments({ 
        project: project._id 
      });
      return { ...project, proposalCount };
    })
  );

  const result = {
    projects: projectsWithCounts,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  };

  console.log(`[GET PROJECTS] Returning ${projectsWithCounts.length} projects with counts`);

  // Cache the result for 5 minutes
  await setCache(cacheKey, result, 300);

  res.json({
    status: 'success',
    data: result,
  });
});

export const getProjectById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate('client', 'profile rating clientProfile')
    .populate('organization', 'name logo budget members')
    .populate('category', '_id name')
    .populate('selectedFreelancer', 'profile rating freelancerProfile')
    .populate({
      path: 'proposals',
      populate: {
        path: 'freelancer',
        select: 'profile rating freelancerProfile',
      },
    });

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Increment view count (don't await to avoid blocking)
  project.incrementViewCount().catch(console.error);

  res.json({
    status: 'success',
    data: {
      project,
    },
  });
});

export const updateProject = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user owns the project
  if (project.client.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only update your own projects', 403));
  }

  // Don't allow updates if project is in progress or completed
  if (['in_progress', 'completed'].includes(project.status)) {
    return next(new AppError('Cannot update project in current status', 400));
  }

  // Handle organization change
  if (req.body.organization && req.body.organization !== project.organization?.toString()) {
    const { Organization } = await import('@/models/Organization');
    const org = await Organization.findById(req.body.organization);
    
    if (!org) {
      return next(new AppError('Organization not found', 404));
    }

    const isMember = org.owner.toString() === req.user._id.toString() ||
      org.members.some((m: any) => m.user.toString() === req.user._id.toString());
    
    if (!isMember) {
      return next(new AppError('You are not a member of this organization', 403));
    }

    // Remove from old organization if it exists
    if (project.organization) {
      await Organization.findByIdAndUpdate(
        project.organization,
        { $pull: { projects: project._id } }
      );
    }

    // Add to new organization
    await Organization.findByIdAndUpdate(
      req.body.organization,
      { $push: { projects: project._id } }
    );
  }

  const updatedProject = await Project.findByIdAndUpdate(
    id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('client', 'profile rating clientProfile')
   .populate('organization', 'name logo budget')
   .populate('category', '_id name');

  // Clear cache
  await deleteCache('projects:*');

  res.json({
    status: 'success',
    message: 'Project updated successfully',
    data: {
      project: updatedProject,
    },
  });
});

export const deleteProject = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user owns the project
  if (project.client.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own projects', 403));
  }

  // Don't allow deletion if project has proposals or is in progress
  if (project.proposals.length > 0 || project.status === 'in_progress') {
    return next(new AppError('Cannot delete project with proposals or in progress', 400));
  }

  // Remove from organization if linked
  if (project.organization) {
    const { Organization } = await import('@/models/Organization');
    await Organization.findByIdAndUpdate(
      project.organization,
      { $pull: { projects: project._id } }
    );
  }

  await Project.findByIdAndDelete(id);

  // Update client's project count
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'clientProfile.projectsPosted': -1 },
  });

  // Clear cache
  await deleteCache('projects:*');

  res.json({
    status: 'success',
    message: 'Project deleted successfully',
  });
});export 
const getMyProjects = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const query: any = { client: req.user._id };

  if (status) {
    query.status = status;
  }

  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('selectedFreelancer', 'profile rating freelancerProfile')
      .populate('client', 'profile rating clientProfile')
      .populate('category', '_id name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string))
      .lean(),
    Project.countDocuments(query),
  ]);

  // Add proposal counts to each project
  const { Proposal } = await import('@/models/Proposal');
  const projectsWithCounts = await Promise.all(
    projects.map(async (project: any) => {
      const proposalCount = await Proposal.countDocuments({ 
        project: project._id 
      });
      return { ...project, proposalCount };
    })
  );

  res.json({
    status: 'success',
    data: {
      projects: projectsWithCounts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const searchProjects = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return next(new AppError('Search query is required', 400));
  }

  const projects = await Project.searchProjects(q as string)
    .populate('client', 'profile rating clientProfile')
    .limit(parseInt(limit as string));

  res.json({
    status: 'success',
    data: {
      projects,
      query: q,
    },
  });
});

export const getProjectCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const cacheKey = 'project:categories';
  
  // Try cache first
  let categories = await getCache(cacheKey);
  
  if (!categories) {
    categories = await Project.distinct('category', { status: 'open', visibility: 'public' });
    // Cache for 1 hour
    await setCache(cacheKey, categories, 3600);
  }

  res.json({
    status: 'success',
    data: {
      categories,
    },
  });
});

export const getProjectStats = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let stats: any = {};

  if (userRole === 'client') {
    const [total, draft, open, inProgress, completed] = await Promise.all([
      Project.countDocuments({ client: userId }),
      Project.countDocuments({ client: userId, status: 'draft' }),
      Project.countDocuments({ client: userId, status: 'open' }),
      Project.countDocuments({ client: userId, status: 'in_progress' }),
      Project.countDocuments({ client: userId, status: 'completed' }),
    ]);

    stats = {
      total,
      draft,
      open,
      inProgress,
      completed,
    };
  } else if (userRole === 'freelancer') {
    // For freelancers, show projects they can apply to
    const [available, applied] = await Promise.all([
      Project.countDocuments({ 
        status: 'open', 
        visibility: 'public',
        skills: { $in: req.user.freelancerProfile?.skills || [] },
      }),
      Project.countDocuments({ 
        proposals: { $in: [/* user's proposals */] },
      }),
    ]);

    stats = {
      available,
      applied,
    };
  }

  res.json({
    status: 'success',
    data: {
      stats,
    },
  });
});

export const toggleProjectStatus = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['draft', 'open', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check ownership
  if (project.client.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only update your own projects', 403));
  }

  // Validate status transitions
  const currentStatus = project.status;
  const validTransitions: { [key: string]: string[] } = {
    draft: ['open', 'cancelled'],
    open: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['open'], // Allow reopening cancelled projects
  };

  if (!validTransitions[currentStatus].includes(status)) {
    return next(new AppError(`Cannot change status from ${currentStatus} to ${status}`, 400));
  }

  project.status = status;
  if (status === 'in_progress' && !project.startDate) {
    project.startDate = new Date();
  }
  await project.save();

  // Clear cache
  await deleteCache('projects:*');

  res.json({
    status: 'success',
    message: 'Project status updated successfully',
    data: {
      project,
    },
  });
});

// Get dashboard stats for user
export const getMyProjectStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  
  console.log(`[DASHBOARD STATS] Fetching stats for user: ${userId}, role: ${userRole}`);
  
  const { Proposal } = await import('@/models/Proposal');
  const { Contract } = await import('@/models/Contract');
  const { Review } = await import('@/models/Review');
  
  if (userRole === 'client') {
    console.log(`[DASHBOARD STATS] Client stats requested`);
    
    // Get all project IDs for this client
    const projectIds = await Project.find({ client: userId }).distinct('_id');
    console.log(`[DASHBOARD STATS] Found ${projectIds.length} projects for client`);
    
    const [totalProjects, activeProjects, completedProjects, receivedProposals, totalSpent, totalContracts, ongoingContracts] = await Promise.all([
      Project.countDocuments({ client: userId }),
      Project.countDocuments({ client: userId, status: 'open' }),
      Project.countDocuments({ client: userId, status: 'completed' }),
      Proposal.countDocuments({ 
        project: { $in: projectIds },
        status: 'submitted'
      }),
      Contract.aggregate([
        { $match: { client: userId, status: { $in: ['active', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      Contract.countDocuments({ client: userId }),
      Contract.countDocuments({ client: userId, status: 'active' }),
    ]);
    
    console.log(`[DASHBOARD STATS] Client stats:`, {
      totalProjects,
      activeProjects,
      completedProjects,
      receivedProposals,
      totalSpent,
      totalContracts,
      ongoingContracts,
    });
    
    return res.json({
      status: 'success',
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        receivedProposals,
        totalSpent,
        totalContracts,
        ongoingContracts,
      },
    });
  }
  
  if (userRole === 'freelancer') {
    console.log(`[DASHBOARD STATS] Freelancer stats requested`);
    
    const [totalProposals, acceptedProposals, activeContracts, totalEarnings, totalContracts, totalReviews] = await Promise.all([
      Proposal.countDocuments({ freelancer: userId }),
      Proposal.countDocuments({ freelancer: userId, status: 'accepted' }),
      Contract.countDocuments({ freelancer: userId, status: 'active' }),
      Contract.aggregate([
        { $match: { freelancer: userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      Contract.countDocuments({ freelancer: userId }),
      Review.countDocuments({ freelancer: userId }),
    ]);
    
    console.log(`[DASHBOARD STATS] Freelancer stats:`, {
      totalProposals,
      acceptedProposals,
      activeContracts,
      totalEarnings,
      totalContracts,
      totalReviews,
    });
    
    return res.json({
      status: 'success',
      data: {
        totalProposals,
        acceptedProposals,
        activeProjects: activeContracts,
        totalEarnings,
        totalContracts,
        totalReviews,
      },
    });
  }
  
  res.json({
    status: 'success',
    data: {},
  });
});
