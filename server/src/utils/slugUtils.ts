import { User } from '@/models/User';

/**
 * Generate a URL-friendly slug from a name
 * @param name - The name to convert to a slug
 * @returns A sanitized slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit to 50 characters
}

/**
 * Check if a slug is available
 * @param slug - The slug to check
 * @param excludeUserId - Optional user ID to exclude from check (for updates)
 * @returns True if slug is available
 */
export async function isSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
  const query: any = { profileSlug: slug };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  
  const existingUser = await User.findOne(query);
  return !existingUser;
}

/**
 * Validate slug format
 * @param slug - The slug to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateSlugFormat(slug: string): { isValid: boolean; error?: string } {
  if (!slug || slug.trim().length === 0) {
    return { isValid: false, error: 'Slug cannot be empty' };
  }

  if (slug.length < 3) {
    return { isValid: false, error: 'Slug must be at least 3 characters long' };
  }

  if (slug.length > 50) {
    return { isValid: false, error: 'Slug cannot exceed 50 characters' };
  }

  // Check for valid characters (lowercase letters, numbers, hyphens)
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return { 
      isValid: false, 
      error: 'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive or leading/trailing hyphens)' 
    };
  }

  // Check for reserved slugs
  const reservedSlugs = [
    'admin', 'api', 'auth', 'login', 'register', 'signup', 'signin',
    'dashboard', 'profile', 'settings', 'help', 'support', 'about',
    'terms', 'privacy', 'contact', 'blog', 'docs', 'documentation',
    'freelancer', 'client', 'user', 'users', 'account', 'accounts'
  ];

  if (reservedSlugs.includes(slug.toLowerCase())) {
    return { isValid: false, error: 'This slug is reserved and cannot be used' };
  }

  return { isValid: true };
}

/**
 * Generate unique slug suggestions based on a base slug
 * @param baseSlug - The base slug to generate suggestions from
 * @param count - Number of suggestions to generate (default: 5)
 * @returns Array of available slug suggestions
 */
export async function generateSlugSuggestions(baseSlug: string, count: number = 5): Promise<string[]> {
  const suggestions: string[] = [];
  const sanitizedBase = generateSlug(baseSlug);

  // Try base slug first
  if (await isSlugAvailable(sanitizedBase)) {
    suggestions.push(sanitizedBase);
  }

  // Generate numbered suggestions
  for (let i = 1; suggestions.length < count && i <= 99; i++) {
    const numberedSlug = `${sanitizedBase}-${i}`;
    if (await isSlugAvailable(numberedSlug)) {
      suggestions.push(numberedSlug);
    }
  }

  // Generate random suffix suggestions
  while (suggestions.length < count) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const randomSlug = `${sanitizedBase}-${randomSuffix}`;
    
    if (await isSlugAvailable(randomSlug) && !suggestions.includes(randomSlug)) {
      suggestions.push(randomSlug);
    }
  }

  return suggestions.slice(0, count);
}

/**
 * Generate a unique slug from a user's name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns A unique slug
 */
export async function generateUniqueSlugFromName(firstName: string, lastName: string): Promise<string> {
  const fullName = `${firstName} ${lastName}`;
  const baseSlug = generateSlug(fullName);

  // Check if base slug is available
  if (await isSlugAvailable(baseSlug)) {
    return baseSlug;
  }

  // Try with just first name
  const firstNameSlug = generateSlug(firstName);
  if (await isSlugAvailable(firstNameSlug)) {
    return firstNameSlug;
  }

  // Generate numbered version
  for (let i = 1; i <= 999; i++) {
    const numberedSlug = `${baseSlug}-${i}`;
    if (await isSlugAvailable(numberedSlug)) {
      return numberedSlug;
    }
  }

  // Fallback to random suffix
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Sanitize a slug input
 * @param input - The input string to sanitize
 * @returns Sanitized slug
 */
export function sanitizeSlugInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50);
}
