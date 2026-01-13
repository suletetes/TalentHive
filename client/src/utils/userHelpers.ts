/**
 * User profile data handling utilities with proper fallbacks
 */

export interface UserProfile {
  _id: string;
  email: string;
  role: string;
  roles?: string[];
  isActive: boolean;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    phone?: string;
    hourlyRate?: number;
    skills?: string[];
    experience?: string;
    education?: any[];
    certifications?: any[];
  };
  rating?: {
    average: number;
    count: number;
  };
  stats?: {
    projectsCompleted?: number;
    totalEarnings?: number;
    successRate?: number;
    responseTime?: number;
  };
  preferences?: {
    notifications?: any;
    privacy?: any;
  };
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
  
  // Fallback to email username
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown User';
}

/**
 * Get user's display name (first name or fallback)
 */
export function getUserDisplayName(user: any): string {
  if (!user) return 'Unknown';
  
  const profile = user.profile || {};
  if (profile.firstName) return profile.firstName;
  
  // Fallback to email username
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown';
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
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  
  if (firstName) return firstName[0].toUpperCase();
  if (lastName) return lastName[0].toUpperCase();
  
  // Fallback to email
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return 'U';
}

/**
 * Get user's avatar URL with fallback
 */
export function getUserAvatar(user: any): string | null {
  if (!user) return null;
  
  const profile = user.profile || {};
  return profile.avatar || null;
}

/**
 * Get user's rating with fallbacks
 */
export function getUserRating(user: any): { average: number; count: number } {
  if (!user || !user.rating) {
    return { average: 0, count: 0 };
  }
  
  return {
    average: user.rating.average || 0,
    count: user.rating.count || 0,
  };
}

/**
 * Get user's stats with fallbacks
 */
export function getUserStats(user: any): {
  projectsCompleted: number;
  totalEarnings: number;
  successRate: number;
  responseTime: number;
} {
  const defaultStats = {
    projectsCompleted: 0,
    totalEarnings: 0,
    successRate: 0,
    responseTime: 0,
  };
  
  if (!user || !user.stats) {
    return defaultStats;
  }
  
  return {
    projectsCompleted: user.stats.projectsCompleted || 0,
    totalEarnings: user.stats.totalEarnings || 0,
    successRate: user.stats.successRate || 0,
    responseTime: user.stats.responseTime || 0,
  };
}

/**
 * Get user's skills array with fallback
 */
export function getUserSkills(user: any): string[] {
  if (!user || !user.profile || !user.profile.skills) {
    return [];
  }
  
  return Array.isArray(user.profile.skills) ? user.profile.skills : [];
}

/**
 * Get user's hourly rate with fallback
 */
export function getUserHourlyRate(user: any): number | null {
  if (!user || !user.profile) return null;
  
  const rate = user.profile.hourlyRate;
  return typeof rate === 'number' && rate > 0 ? rate : null;
}

/**
 * Format user's hourly rate for display
 */
export function formatUserHourlyRate(user: any): string {
  const rate = getUserHourlyRate(user);
  return rate ? `$${rate}/hr` : 'Rate not set';
}

/**
 * Check if user profile is complete
 */
export function isUserProfileComplete(user: any): boolean {
  if (!user || !user.profile) return false;
  
  const profile = user.profile;
  const requiredFields = ['firstName', 'lastName'];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!profile[field] || profile[field].trim() === '') {
      return false;
    }
  }
  
  // Role-specific requirements
  if (user.role === 'freelancer') {
    const freelancerRequiredFields = ['bio', 'skills', 'hourlyRate'];
    for (const field of freelancerRequiredFields) {
      if (!profile[field]) return false;
      if (field === 'skills' && (!Array.isArray(profile[field]) || profile[field].length === 0)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Get profile completion percentage
 */
export function getProfileCompletionPercentage(user: any): number {
  if (!user || !user.profile) return 0;
  
  const profile = user.profile;
  const allFields = [
    'firstName', 'lastName', 'bio', 'location', 'avatar', 
    'skills', 'hourlyRate', 'experience', 'website'
  ];
  
  let completedFields = 0;
  
  for (const field of allFields) {
    if (profile[field]) {
      if (field === 'skills' && Array.isArray(profile[field]) && profile[field].length > 0) {
        completedFields++;
      } else if (field !== 'skills' && profile[field].toString().trim() !== '') {
        completedFields++;
      }
    }
  }
  
  return Math.round((completedFields / allFields.length) * 100);
}

/**
 * Validate user reference in API responses
 */
export function validateUserReference(userRef: any): boolean {
  if (!userRef) return false;
  
  // Handle both populated and unpopulated references
  if (typeof userRef === 'string') {
    return userRef.length > 0;
  }
  
  if (typeof userRef === 'object') {
    return userRef._id && typeof userRef._id === 'string';
  }
  
  return false;
}

/**
 * Extract user ID from reference (populated or unpopulated)
 */
export function extractUserId(userRef: any): string | null {
  if (!userRef) return null;
  
  if (typeof userRef === 'string') {
    return userRef;
  }
  
  if (typeof userRef === 'object' && userRef._id) {
    return userRef._id;
  }
  
  return null;
}

/**
 * Normalize user data from API response
 */
export function normalizeUserData(userData: any): UserProfile | null {
  if (!userData || !userData._id) return null;
  
  return {
    _id: userData._id,
    email: userData.email || '',
    role: userData.role || 'user',
    roles: userData.roles || [userData.role || 'user'],
    isActive: userData.isActive !== false,
    profile: {
      firstName: userData.profile?.firstName || '',
      lastName: userData.profile?.lastName || '',
      avatar: userData.profile?.avatar || undefined,
      bio: userData.profile?.bio || undefined,
      location: userData.profile?.location || undefined,
      website: userData.profile?.website || undefined,
      phone: userData.profile?.phone || undefined,
      hourlyRate: userData.profile?.hourlyRate || undefined,
      skills: userData.profile?.skills || [],
      experience: userData.profile?.experience || undefined,
      education: userData.profile?.education || [],
      certifications: userData.profile?.certifications || [],
    },
    rating: userData.rating ? {
      average: userData.rating.average || 0,
      count: userData.rating.count || 0,
    } : undefined,
    stats: userData.stats ? {
      projectsCompleted: userData.stats.projectsCompleted || 0,
      totalEarnings: userData.stats.totalEarnings || 0,
      successRate: userData.stats.successRate || 0,
      responseTime: userData.stats.responseTime || 0,
    } : undefined,
    preferences: userData.preferences || undefined,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString(),
  };
}

/**
 * Check if user has specific role
 */
export function userHasRole(user: any, role: string): boolean {
  if (!user) return false;
  
  const userRoles = user.roles && user.roles.length > 0 
    ? user.roles 
    : [user.role];
  
  return userRoles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function userHasAnyRole(user: any, roles: string[]): boolean {
  return roles.some(role => userHasRole(user, role));
}

/**
 * Get user's role display name
 */
export function getUserRoleDisplayName(user: any): string {
  if (!user) return 'Unknown';
  
  const role = user.role || 'user';
  
  const roleNames: Record<string, string> = {
    admin: 'Administrator',
    client: 'Client',
    freelancer: 'Freelancer',
    moderator: 'Moderator',
    user: 'User',
  };
  
  return roleNames[role] || role.charAt(0).toUpperCase() + role.slice(1);
}