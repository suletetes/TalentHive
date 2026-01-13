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
  