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
 * Atomically reserve a slug for a user (handles race conditions)
 * @param userId - The user ID to assign the slug to
 * @param slug - The slug to reserve
 * @param excludeUserId - Optional user ID to exclude from check (for updates)
 * @returns True if slug was successfully reserved
 */
export async function reserveSlugForUser(userId: string, slug: string, excludeUserId?: string): Promise<boolean> {
  try {
    const query: any = { profileSlug: slug };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    // Use findOneAndUpdate with upsert to atomically check and reserve
    const result = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { profileSlug: slug } },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!result) {
      return false; // User not found
    }

    // Double-check that no other user has this slug (in case of race condition)
    const conflictingUser = await User.findOne({
      profileSlug: slug,
      _id: { $ne: userId }
    });

    if (conflictingUser) {
      // Rollback - remove the slug from this user
      await User.findByIdAndUpdate(userId, { $unset: { profileSlug: 1 } });
      return false;
    }

    return true;
  } catch (error: any) {
    // Handle duplicate key error (E11000)
    if (error.code === 11000 && error.keyPattern?.profileSlug) {
      return false; // Slug already taken
    }
    throw error; // Re-throw other errors
  }
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
 * Generate a unique slug from a user's name and atomically assign it
 * @param userId - The user ID to assign the slug to
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns A unique slug that has been atomically assigned
 */
export async function generateAndReserveUniqueSlug(userId: string, firstName: string, lastName: string): Promise<string> {
  const fullName = `${firstName} ${lastName}`;
  const baseSlug = generateSlug(fullName);

  // Try base slug first
  if (await reserveSlugForUser(userId, baseSlug)) {
    return baseSlug;
  }

  // Try with just first name
  const firstNameSlug = generateSlug(firstName);
  if (await reserveSlugForUser(userId, firstNameSlug)) {
    return firstNameSlug;
  }

  // Generate numbered version
  for (let i = 1; i <= 999; i++) {
    const numberedSlug = `${baseSlug}-${i}`;
    if (await reserveSlugForUser(userId, numberedSlug)) {
      return numberedSlug;
    }
  }

  // Fallback to random suffix (try multiple times)
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const randomSlug = `${baseSlug}-${randomSuffix}`;
    if (await reserveSlugForUser(userId, randomSlug)) {
      return randomSlug;
    }
  }

  // Final fallback with timestamp
  const timestampSlug = `${baseSlug}-${Date.now()}`;
  if (await reserveSlugForUser(userId, timestampSlug)) {
    return timestampSlug;
  }

  throw new Error('Unable to generate unique slug after multiple attempts');
}

/**
 * Generate a unique slug from a user's name (legacy function - use generateAndReserveUniqueSlug for new code)
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns A unique slug (but not atomically reserved)
 * @deprecated Use generateAndReserveUniqueSlug instead to avoid race conditions
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
