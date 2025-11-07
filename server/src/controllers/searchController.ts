import { Request, Response } from 'express';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { catchAsync } from '@/middleware/errorHandler';
import { getCache, setCache } from '@/config/redis';

interface AuthRequest extends Request {
  user?: any;
}

export const searchProjects = catchAsync(async (req: AuthRequest, res: Response) => {
  const {
    q,
    category,
    skills,
    budgetMin,
    budgetMax,
    budgetType,
    page = 1,
    limit = 20,
    sort = 'createdAt',
  } = req.query;

  const cacheKey = `search:projects:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const query: any = { status: 'open' };

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }

  if (category) query.category = category;
  
  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    query.skills = { $in: skillsArray };
  }

  if (budgetMin || budgetMax) {
    query['budget.min'] = {};
    if (budgetMin) query['budget.min'].$gte = parseInt(budgetMin as string);
    if (budgetMax) query['budget.max'] = { $lte: parseInt(budgetMax as string) };
  }

  if (budgetType) query['budget.type'] = budgetType;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const sortField = sort === 'budget' ? 'budget.min' : sort as string;

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('client', 'profile rating')
      .sort({ [sortField]: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Project.countDocuments(query),
  ]);

  const result = {
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
  };

  await setCache(cacheKey, JSON.stringify(result), 300); // 5 minutes

  res.json(result);
});

export const searchFreelancers = catchAsync(async (req: AuthRequest, res: Response) => {
  const {
    q,
    skills,
    minRating,
    hourlyRateMin,
    hourlyRateMax,
    page = 1,
    limit = 20,
  } = req.query;

  const cacheKey = `search:freelancers:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const query: any = { role: 'freelancer', isEmailVerified: true };

  if (q) {
    query.$or = [
      { 'profile.firstName': { $regex: q, $options: 'i' } },
      { 'profile.lastName': { $regex: q, $options: 'i' } },
      { 'freelancerProfile.title': { $regex: q, $options: 'i' } },
      { 'freelancerProfile.bio': { $regex: q, $options: 'i' } },
    ];
  }

  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    query['freelancerProfile.skills'] = { $in: skillsArray };
  }

  if (minRating) query.rating = { $gte: parseFloat(minRating as string) };

  if (hourlyRateMin || hourlyRateMax) {
    query['freelancerProfile.hourlyRate'] = {};
    if (hourlyRateMin) query['freelancerProfile.hourlyRate'].$gte = parseInt(hourlyRateMin as string);
    if (hourlyRateMax) query['freelancerProfile.hourlyRate'].$lte = parseInt(hourlyRateMax as string);
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [freelancers, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ rating: -1, 'freelancerProfile.completedProjects': -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    User.countDocuments(query),
  ]);

  const result = {
    status: 'success',
    data: {
      freelancers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  };

  await setCache(cacheKey, JSON.stringify(result), 300);

  res.json(result);
});

export const getRecommendations = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'freelancer') {
    return res.json({
      status: 'success',
      data: { projects: [] },
    });
  }

  const userSkills = req.user.freelancerProfile?.skills || [];
  
  const projects = await Project.find({
    status: 'open',
    skills: { $in: userSkills },
  })
    .populate('client', 'profile rating')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    status: 'success',
    data: { projects },
  });
});

export const getSearchSuggestions = catchAsync(async (req: Request, res: Response) => {
  const { q, type = 'projects' } = req.query;

  if (!q || (q as string).length < 2) {
    return res.json({
      status: 'success',
      data: { suggestions: [] },
    });
  }

  let suggestions: string[] = [];

  if (type === 'projects') {
    const projects = await Project.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { skills: { $regex: q, $options: 'i' } },
      ],
      status: 'open',
    })
      .select('title skills')
      .limit(5);

    suggestions = [
      ...projects.map(p => p.title),
      ...projects.flatMap(p => p.skills),
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
  } else if (type === 'skills') {
    const users = await User.find({
      'freelancerProfile.skills': { $regex: q, $options: 'i' },
    })
      .select('freelancerProfile.skills')
      .limit(10);

    const allSkills = users.flatMap(u => u.freelancerProfile?.skills || []);
    suggestions = [...new Set(allSkills)]
      .filter(skill => skill.toLowerCase().includes((q as string).toLowerCase()))
      .slice(0, 5);
  }

  res.json({
    status: 'success',
    data: { suggestions },
  });
});