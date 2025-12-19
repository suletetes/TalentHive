import { User } from '@/models/User';
import { IUser } from '@/types/user';
import mongoose from 'mongoose';

/**
 * Resolve user identifier (slug or ID) to user document
 * @param identifier - Can be either a profileSlug or ObjectId
 * @returns User document or null if not found
 */
export async function resolveUserBySlugOrId(identifier: string): Promise<IUser | null> {
  if (!identifier) {
    return null;
  }

  // Check if it's a valid ObjectId format (24 hex characters)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  
  if (isObjectId) {
    // It's an ObjectId, find by _id
    return await User.findById(identifier);
  } else {
    // It's a slug, find by profileSlug
    return await User.findOne({ profileSlug: identifier.toLowerCase() });
  }
}

/**
 * Resolve user identifier to ObjectId
 * @param identifier - Can be either a profileSlug or ObjectId string
 * @returns ObjectId or null if user not found
 */
export async function resolveUserIdBySlugOrId(identifier: string): Promise<mongoose.Types.ObjectId | null> {
  const user = await resolveUserBySlugOrId(identifier);
  return user ? user._id as mongoose.Types.ObjectId : null;
}

/**
 * Get user's display identifier (slug if available, otherwise ID)
 * @param user - User document
 * @returns profileSlug if available, otherwise _id as string
 */
export function getUserDisplayId(user: IUser): string {
  return user.profileSlug || user._id.toString();
}

/**
 * Resolve multiple user identifiers to ObjectIds
 * @param identifiers - Array of slugs or IDs
 * @returns Array of ObjectIds for found users
 */
export async function resolveMultipleUserIds(identifiers: string[]): Promise<mongoose.Types.ObjectId[]> {
  const userIds: mongoose.Types.ObjectId[] = [];
  
  for (const identifier of identifiers) {
    const userId = await resolveUserIdBySlugOrId(identifier);
    if (userId) {
      userIds.push(userId);
    }
  }
  
  return userIds;
}

/**
 * Check if identifier is a valid slug format
 * @param identifier - String to check
 * @returns true if it looks like a slug (not ObjectId)
 */
export function isSlugFormat(identifier: string): boolean {
  // ObjectId is 24 hex characters, slugs are typically alphanumeric with dashes/underscores
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  return !isObjectId;
}