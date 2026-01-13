/**
 * User profile data handling utilities with proper fallbacks
 */

export interface UserProfile {
  _id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    skills?: string[];
    hourlyRate?: number;
    availability?: string;
    languages?: string[];
    timezone?: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  stats?: {
    projectsCompleted?: number;
    totalEarnings?: number;
    successRate?: number;
    responseTime?: string;
  };
  stripeCustomerId?: string;
  stripeConnectedAccountId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get user's full name with fallbacks
 */
export function getUserFullName(user: any): string {
  if (!user) return 'Unknown User';
  
  const profile = user.profile || {};
  const firstName = profile.firstName || '';
  const lastName = profile.lastName || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  if (firstName) return firstName;
  if (lastName) return lastName;
  
  // Fallback to email prefix
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }
  
  return 'Unknown User';
}

/**
 * Get user's display name (first name or email prefix)
 */
export function getUserDisplayName(user: any): string {
  if (!user) return 'Unknown';
  
  const profile = user.profile || {};
  const firstName = profile.firstName;
  
  if (firstName) return firstName;
  
  // Fallback to email prefix
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }
  
  return 'Unknown';
}

/**
 * Get user's avatar URL with fallback
 */
export function getUserAvatar(user: any): string | undefined {
  if (!user) return undefined;
  
  const profile = user.profile || {};
  return profile.avatar;
}

/**
 * Get user's initials for avatar fallback
 */
export function getUserInitials(user: any): string {
  if (!user) return 'U';
  
  const profile = user.profile || {};
  const firstName = profile.firstName || '';
  const lastName = profile.lastName || '';
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  if (firstName) return firstName.charAt(0).toUpperCase();
  if (lastName) return lastName.charAt(0).toUpperCase();
  
  // Fallback to email
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
}

/**
 * Get user's rating display
 */
export function getUserRating(user: any): { average: number; count: number } {
  if (!user || !user.rating) {
    return { average: 0, count: 0 };
  }
  
  return {
    average: user.rating.average || 0,
    count: user.rating.count || 0
  };
}

/**
 * Get user's hourly rate with currency formatting
 */
export function getUserHourlyRate(user: any): string {
  if (!user || !user.profile || !user.profile.hourlyRate) {
    return 'Rate not set';
  }
  
  return `$${user.profile.hourlyRate}/hr`;
}

/**
 * Check if user profile is complete
 */
export function isProfileComplete(user: any): boolean {
  if (!user || !user.profile) return false;
  
  const profile = user.profile;
  const requiredFields = ['firstName', 'lastName'];
  
  return requiredFields.every(field => profile[field] && profile[field].trim() !== '');
}

/**
 * Get user's location display
 */
export function getUserLocation(user: any): string {
  if (!user || !user.profile || !user.profile.location) {
    return 'Location not set';
  }
  
  return user.profile.location;
}

/**
 * Get user's skills array
 */
export function getUserSkills(user: any): string[] {
  if (!user || !user.profile || !user.profile.skills) {
    return [];
  }
  
  return Array.isArray(user.profile.skills) ? user.profile.skills : [];
}