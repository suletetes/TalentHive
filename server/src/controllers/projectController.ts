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

  // Validate budget range
  if (projectData.budget.min > projectData.budget.max) {
    return next(new AppError('Minimum budget cannot be greater than maximum budget', 400));
  }

  const project = new Project(projectData);
  await project.save();

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
  } = req.query;

  // Build cache key
  const cacheKey = `projects:${JSON.stringify(req.query)}`;
  
  // Try to get from cache first
  const cachedResult = await getCache(cacheKey);
  if (cachedResult) {
    return res.json({
      status: 'success',
      data: cachedResult,
    });
  }

  const query: any = {
    visibility: 'public',
    status: status || 'open',
  };

  // Add filters
  if (category) {
    query.category = category;
  }

  if (skills) {
    const skillsArray = (skills as string).split(',');
    query.skills = { $in: skillsArray };
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
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string)),
    Project.countDocuments(query),
  ]);

  const result = {
    projects,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  };

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

  const updatedProject = await Project.findByIdAndUpdate(
    id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('client', 'profile rating clientProfile');

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
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string)),
    Project.countDocuments(query),
  ]);

  res.json({
    status: 'success',
    data: {
      projects,
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