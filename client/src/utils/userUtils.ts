/**
 * Utility functions for handling user identifiers (slugs vs IDs)
 */

export interface User {
  _id: string;
  id?: string;
  profileSlug?: string;
  role: 'freelancer' | 'client' | 'admin';
  profile: {
    firstName: string;
    lastName: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Get the best identifier for a user (slug if available, otherwise ID)
 * @param user - User object
 * @returns profileSlug if available, otherwise _id or id
 */
export function getUserIdentifier(user: User): string {
  return user.profileSlug || user._id || user.id || '';
}

/**
 * Get the profile URL for a user
 * @param user - User object
 * @returns Profile URL using slug or ID
 */
export function getUserProfileUrl(user: User): string {
  const identifier = getUserIdentifier(user);
  
  switch (user.role) {
    case 'freelancer':
      return `/freelancer/${identifier}`;
    case 'client':
      return `/client/${identifier}`;
    default:
      return `/profile/${identifier}`;
  }
}

/**
 * Check if an identifier is likely a slug (not an ObjectId)
 * @param identifier - String to check
 * @returns true if it looks like a slug
 */
export function isSlugFormat(identifier: string): boolean {
  // ObjectId is 24 hex characters, slugs are typically alphanumeric with dashes/underscores
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  return !isObjectId;
}

/**
 * Generate a profile URL from user data
 * @param user - User object or partial user data
 * @param role - User role if not in user object
 * @returns Profile URL
 */
export function generateProfileUrl(user: Partial<User>, role?: string): string {
  const userRole = user.role || role;
  const identifier = user.profileSlug || user._id || user.id;
  
  if (!identifier || !userRole) {
    return '#';
  }
  
  switch (userRole) {
    case 'freelancer':
      return `/freelancer/${identifier}`;
    case 'client':
      return `/client/${identifier}`;
    default:
      return `/profile/${identifier}`;
  }
}

/**
 * Get display name for a user
 * @param user - User object
 * @returns Full name or fallback
 */
export function getUserDisplayName(user: User): string {
  if (user.profile?.firstName && user.profile?.lastName) {
    return `${user.profile.firstName} ${user.profile.lastName}`;
  }
  
  if (user.profile?.firstName) {
    return user.profile.firstName;
  }
  
  return user.profileSlug || 'User';
}

/**
 * Create a user reference object for API calls
 * @param user - User object
 * @returns Object with identifier and display info
 */
export function createUserReference(user: User) {
  return {
    id: getUserIdentifier(user),
    name: getUserDisplayName(user),
    profileUrl: getUserProfileUrl(user),
    avatar: user.profile?.avatar,
    role: user.role,
  };
}