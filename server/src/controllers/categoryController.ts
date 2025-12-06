import { Request, Response, NextFunction } from 'express';
import { Category } from '@/models/Category';
import { AppError, catchAsync } from '@/middleware/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

// Get all categories
export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const { search, isActive } = req.query;
  
  const query: any = {};
  
  if (search) {
    query.$text = { $search: search as string };
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  const categories = await Category.find(query).sort({ projectCount: -1, name: 1 });
  
  res.json({
    status: 'success',
    data: categories,
  });
});

// Create category
export const createCategory = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, description, icon } = req.body;
  
  if (!name) {
    return next(new AppError('Category name is required', 400));
  }
  
  // Create slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Check if category already exists
  const existing = await Category.findOne({ $or: [{ name }, { slug }] });
  if (existing) {
    return next(new AppError('Category already exists', 400));
  }
  
  const category = await Category.create({
    name,
    slug,
    description,
    icon,
    createdBy: req.user._id,
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      category,
    },
  });
});

// Update category
export const updateCategory = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, description, icon, isActive } = req.body;
  
  const category = await Category.findById(id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  if (name) {
    category.name = name;
    category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  if (description !== undefined) category.description = description;
  if (icon !== undefined) category.icon = icon;
  if (isActive !== undefined) category.isActive = isActive;
  
  await category.save();
  
  res.json({
    status: 'success',
    data: {
      category,
    },
  });
});

// Delete category
export const deleteCategory = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  await category.deleteOne();
  
  res.json({
    status: 'success',
    message: 'Category deleted successfully',
  });
});
