import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Common validation rules
 */
export const validationRules = {
  // Email validation
  email: () => 
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),

  // Password validation
  password: () => 
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // MongoDB ObjectId validation
  objectId: (field: string) => 
    param(field)
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid ID format');
        }
        return true;
      }),

  // Required string validation
  requiredString: (field: string, minLength: number = 1) => 
    body(field)
      .trim()
      .isLength({ min: minLength })
      .withMessage(`${field} is required and must be at least ${minLength} characters long`),

  // Optional string validation
  optionalString: (field: string, maxLength?: number) => {
    const validator = body(field).optional().trim();
    if (maxLength) {
      validator.isLength({ max: maxLength }).withMessage(`${field} must be less than ${maxLength} characters`);
    }
    return validator;
  },

  // Number validation
  number: (field: string, min?: number, max?: number) => {
    const validator = body(field).isNumeric().withMessage(`${field} must be a number`);
    if (min !== undefined) {
      validator.isFloat({ min }).withMessage(`${field} must be at least ${min}`);
    }
    if (max !== undefined) {
      validator.isFloat({ max }).withMessage(`${field} must be at most ${max}`);
    }
    return validator;
  },

  // Array validation
  array: (field: string, minLength?: number, maxLength?: number) => {
    const validator = body(field).isArray().withMessage(`${field} must be an array`);
    if (minLength !== undefined) {
      validator.isLength({ min: minLength }).withMessage(`${field} must have at least ${minLength} items`);
    }
    if (maxLength !== undefined) {
      validator.isLength({ max: maxLength }).withMessage(`${field} must have at most ${maxLength} items`);
    }
    return validator;
  },

  // URL validation
  url: (field: string) => 
    body(field)
      .optional()
      .isURL()
      .withMessage(`${field} must be a valid URL`),

  // Date validation
  date: (field: string) => 
    body(field)
      .isISO8601()
      .toDate()
      .withMessage(`${field} must be a valid date`),

  // Enum validation
  enum: (field: string, values: string[]) => 
    body(field)
      .isIn(values)
      .withMessage(`${field} must be one of: ${values.join(', ')}`),

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
};

/**
 * Specific validation chains for different entities
 */
export const userValidation = {
  register: [
    validationRules.email(),
    validationRules.password(),
    validationRules.requiredString('role'),
    validationRules.enum('role', ['client', 'freelancer']),
    body('profile.firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('profile.lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  ],

  login: [
    validationRules.email(),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  updateProfile: [
    validationRules.optionalString('profile.firstName'),
    validationRules.optionalString('profile.lastName'),
    validationRules.optionalString('profile.bio', 1000),
    validationRules.url('profile.avatar'),
  ],
};

export const projectValidation = {
  create: [
    validationRules.requiredString('title', 5),
    validationRules.requiredString('description', 20),
    validationRules.requiredString('category'),
    validationRules.array('skills', 1, 20),
    body('budget.type').isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
    validationRules.number('budget.min', 1),
    validationRules.number('budget.max', 1),
    body('budget.max').custom((value, { req }) => {
      if (value <= req.body.budget.min) {
        throw new Error('Maximum budget must be greater than minimum budget');
      }
      return true;
    }),
    validationRules.number('timeline.duration', 1),
    validationRules.enum('timeline.unit', ['days', 'weeks', 'months']),
  ],

  update: [
    validationRules.objectId('id'),
    validationRules.optionalString('title', 5),
    validationRules.optionalString('description', 20),
  ],
};

export const proposalValidation = {
  create: [
    validationRules.objectId('projectId'),
    validationRules.requiredString('coverLetter', 50),
    validationRules.number('bidAmount', 1),
    validationRules.number('timeline.duration', 1),
    validationRules.enum('timeline.unit', ['days', 'weeks', 'months']),
    body('milestones').optional().isArray().withMessage('Milestones must be an array'),
  ],

  respond: [
    validationRules.objectId('id'),
    validationRules.enum('action', ['accept', 'reject']),
    validationRules.optionalString('feedback'),
  ],
};

export const messageValidation = {
  send: [
    validationRules.objectId('conversationId'),
    validationRules.requiredString('content', 1),
    body('attachments').optional().isArray().withMessage('Attachments must be an array'),
  ],

  edit: [
    validationRules.objectId('messageId'),
    validationRules.requiredString('content', 1),
  ],

  react: [
    validationRules.objectId('messageId'),
    body('emoji').trim().isLength({ min: 1, max: 10 }).withMessage('Emoji is required'),
  ],
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (data: any): any => {
  if (typeof data === 'string') {
    return data.trim().replace(/<script[^>]*>.*?<\/script>/gi, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Check if user owns resource
 */
export const checkOwnership = async (
  model: any,
  resourceId: string,
  userId: string,
  ownerField: string = 'user'
): Promise<boolean> => {
  try {
    const resource = await model.findById(resourceId);
    return resource && resource[ownerField].toString() === userId;
  } catch (error) {
    return false;
  }
};
