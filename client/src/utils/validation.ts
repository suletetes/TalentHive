/**
 * Client-side validation utilities for API requests and data integrity
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

export interface ValidationRule<T = any> {
  field: keyof T;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'url' | 'date' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any, data: T) => string | null;
}

/**
 * Generic validation function for data objects
 */
export function validateData<T extends Record<string, any>>(
  data: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  for (const rule of rules) {
    const fieldName = String(rule.field);
    const value = data[rule.field];

    // Required field validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[fieldName] = `${fieldName} is required`;
      continue;
    }

    // Skip further validation if field is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rule.type) {
      const typeError = validateType(value, rule.type, fieldName);
      if (typeError) {
        errors[fieldName] = typeError;
        continue;
      }
    }

    // String length validation
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors[fieldName] = `${fieldName} must be at least ${rule.minLength} characters`;
        continue;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[fieldName] = `${fieldName} must not exceed ${rule.maxLength} characters`;
        continue;
      }
    }

    // Number range validation
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors[fieldName] = `${fieldName} must be at least ${rule.min}`;
        continue;
      }
      if (rule.max !== undefined && value > rule.max) {
        errors[fieldName] = `${fieldName} must not exceed ${rule.max}`;
        continue;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors[fieldName] = `${fieldName} format is invalid`;
        continue;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value, data);
      if (customError) {
        errors[fieldName] = customError;
        continue;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
  };
}

/**
 * Validate data type
 */
function validateType(value: any, type: string, fieldName: string): string | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return `${fieldName} must be a string`;
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return `${fieldName} must be a valid number`;
      }
      break;
    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return `${fieldName} must be a valid email address`;
      }
      break;
    case 'url':
      if (typeof value !== 'string' || !isValidUrl(value)) {
        return `${fieldName} must be a valid URL`;
      }
      break;
    case 'date':
      if (!(value instanceof Date) && !isValidDateString(value)) {
        return `${fieldName} must be a valid date`;
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        return `${fieldName} must be an array`;
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return `${fieldName} must be an object`;
      }
      break;
  }
  return null;
}

/**
 * Email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Date string validation
 */
function isValidDateString(dateString: any): boolean {
  if (typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate API response structure
 */
export function validateApiResponse(response: any, expectedFields: string[]): ValidationResult {
  const errors: Record<string, string> = {};

  if (!response || typeof response !== 'object') {
    errors.response = 'Invalid response format';
    return { isValid: false, errors };
  }

  for (const field of expectedFields) {
    if (!(field in response)) {
      errors[field] = `Missing required field: ${field}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Proposal validation rules
 */
export const proposalValidationRules: ValidationRule[] = [
  { field: 'coverLetter', required: true, type: 'string', minLength: 50, maxLength: 2000 },
  { field: 'bidAmount', required: true, type: 'number', min: 1, max: 1000000 },
  { field: 'timeline', required: true, type: 'object' },
  { 
    field: 'timeline.duration', 
    required: true, 
    type: 'number', 
    min: 1, 
    max: 365,
    custom: (value, data) => {
      if (data.timeline?.unit === 'days' && value > 365) {
        return 'Duration cannot exceed 365 days';
      }
      if (data.timeline?.unit === 'weeks' && value > 52) {
        return 'Duration cannot exceed 52 weeks';
      }
      if (data.timeline?.unit === 'months' && value > 12) {
        return 'Duration cannot exceed 12 months';
      }
      return null;
    }
  },
  { field: 'timeline.unit', required: true, type: 'string' },
];

/**
 * Contract validation rules
 */
export const contractValidationRules: ValidationRule[] = [
  { field: 'title', required: true, type: 'string', minLength: 5, maxLength: 200 },
  { field: 'description', required: true, type: 'string', minLength: 20, maxLength: 5000 },
  { field: 'totalAmount', required: true, type: 'number', min: 1, max: 1000000 },
  { field: 'startDate', required: true, type: 'date' },
  { field: 'milestones', required: true, type: 'array' },
];

/**
 * User profile validation rules
 */
export const userProfileValidationRules: ValidationRule[] = [
  { field: 'firstName', required: true, type: 'string', minLength: 1, maxLength: 50 },
  { field: 'lastName', required: true, type: 'string', minLength: 1, maxLength: 50 },
  { field: 'email', required: true, type: 'email' },
  { field: 'bio', required: false, type: 'string', maxLength: 1000 },
  { field: 'hourlyRate', required: false, type: 'number', min: 1, max: 1000 },
];

/**
 * Project validation rules
 */
export const projectValidationRules: ValidationRule[] = [
  { field: 'title', required: true, type: 'string', minLength: 5, maxLength: 200 },
  { field: 'description', required: true, type: 'string', minLength: 50, maxLength: 10000 },
  { field: 'budget', required: true, type: 'object' },
  { field: 'budget.amount', required: true, type: 'number', min: 1, max: 1000000 },
  { field: 'budget.type', required: true, type: 'string' },
  { field: 'skills', required: true, type: 'array' },
  { field: 'deadline', required: false, type: 'date' },
];

/**
 * Validate proposal data
 */
export function validateProposal(proposal: any): ValidationResult {
  return validateData(proposal, proposalValidationRules);
}

/**
 * Validate contract data
 */
export function validateContract(contract: any): ValidationResult {
  return validateData(contract, contractValidationRules);
}

/**
 * Validate user profile data
 */
export function validateUserProfile(profile: any): ValidationResult {
  return validateData(profile, userProfileValidationRules);
}

/**
 * Validate project data
 */
export function validateProject(project: any): ValidationResult {
  return validateData(project, projectValidationRules);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize form data
 */
export function validateAndSanitizeFormData<T extends Record<string, any>>(
  data: T,
  rules: ValidationRule<T>[]
): { isValid: boolean; sanitizedData: T; errors: Record<string, string> } {
  const validation = validateData(data, rules);
  const sanitizedData = { ...data };

  // Sanitize string fields
  for (const key in sanitizedData) {
    if (typeof sanitizedData[key] === 'string') {
      sanitizedData[key] = sanitizeInput(sanitizedData[key]);
    }
  }

  return {
    isValid: validation.isValid,
    sanitizedData,
    errors: validation.errors,
  };
}