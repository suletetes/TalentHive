import { Request, Response, NextFunction } from 'express';
import { Skill } from '@/models/Skill';
import { AppError, catchAsync } from '@/middleware/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

// Get all skills
export const getSkills = catchAsync(async (req: Request, res: Response) => {
  const { search, category, isActive } = req.query;
  
  const query: any = {};
  
  if (search) {
    query.$text = { $search: search as string };
  }
  
  if (category) {
    query.category = category;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  const skills = await Skill.find(query).sort({ projectCount: -1, freelancerCount: -1, name: 1 });
  
  res.json({
    status: 'success',
    data: {
      skills,
    },
  });
});

// Create skill
export const createSkill = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, category, description } = req.body;
  
  if (!name) {
    return next(new AppError('Skill name is required', 400));
  }
  
  // Create slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Check if skill already exists
  const existing = await Skill.findOne({ $or: [{ name }, { slug }] });
  if (existing) {
    return next(new AppError('Skill already exists', 400));
  }
  
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  const skill = await Skill.create({
    name,
    slug,
    category,
    createdBy: userId,
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      skill,
    },
  });
});

// Update skill
export const updateSkill = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, category, description, isActive } = req.body;
  
  const skill = await Skill.findById(id);
  if (!skill) {
    return next(new AppError('Skill not found', 404));
  }
  
  if (name) {
    skill.name = name;
    skill.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  if (category !== undefined) skill.category = category;
  if (description !== undefined) skill.description = description;
  if (isActive !== undefined) skill.isActive = isActive;
  
  await skill.save();
  
  res.json({
    status: 'success',
    data: {
      skill,
    },
  });
});

// Delete skill
export const deleteSkill = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  const skill = await Skill.findById(id);
  if (!skill) {
    return next(new AppError('Skill not found', 404));
  }
  
  await skill.deleteOne();
  
  res.json({
    status: 'success',
    message: 'Skill deleted successfully',
  });
});
