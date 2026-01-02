import { logger } from '@/utils/logger';
import { SlugGenerator as ISlugGenerator, SlugReservation } from './types';

/**
 * Generates unique, SEO-friendly slugs for user profiles
 * Handles conflict resolution and format validation
 */
export class SlugGenerator implements ISlugGenerator {
  private reservedSlugs: Set<string> = new Set();
  private reservations: Map<string, SlugReservation> = new Map();

  /**
   * Generate a unique slug for a user based on their name
   */
  async generateUserSlug(firstName: string, lastName: string): Promise<string> {
    // Create base slug from name
    const baseSlug = this.createBaseSlug(firstName, lastName);
    
    // Ensure uniqueness
    const uniqueSlug = this.ensureUniqueness(baseSlug, this.reservedSlugs);
    
    // Validate format
    if (!this.validateSlugFormat(uniqueSlug)) {
      throw new Error(`Generated slug "${uniqueSlug}" does not meet format requirements`);
    }

    // Reserve the slug
    await this.reserveSlug(uniqueSlug);
    
    return uniqueSlug;
  }

  /**
   * Ensure slug uniqueness by appending suffixes if needed
   */
  ensureUniqueness(baseSlug: string, existingSlugs: Set<string>): string {
    let candidateSlug = baseSlug;
    let counter = 1;

    // Keep trying with incremental suffixes until we find a unique slug
    while (existingSlugs.has(candidateSlug) || this.reservedSlugs.has(candidateSlug)) {
      candidateSlug = `${baseSlug}-${counter}`;
      counter++;
      
      // Prevent infinite loops with a reasonable limit
      if (counter > 9999) {
        throw new Error(`Unable to generate unique slug for base: ${baseSlug}`);
      }
    }

    return candidateSlug;
  }

  /**
   * Validate slug format according to SEO-friendly conventions
   */
  validateSlugFormat(slug: string): boolean {
    // SEO-friendly slug requirements:
    // - Only lowercase letters, numbers, and hyphens
    // - Cannot start or end with hyphen
    // - Cannot have consecutive hyphens
    // - Must be between 3 and 50 characters
    // - Cannot be only numbers
    
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const numbersOnlyRegex = /^\d+(?:-\d+)*$/;
    
    if (!slug || slug.length < 3 || slug.length > 50) {
      return false;
    }
    
    if (!slugRegex.test(slug)) {
      return false;
    }
    
    if (numbersOnlyRegex.test(slug)) {
      return false;
    }
    
    return true;
  }

  /**
   * Reserve a slug to prevent conflicts during batch generation
   */
  async reserveSlug(slug: string): Promise<boolean> {
    if (this.reservedSlugs.has(slug)) {
      return false;
    }

    const reservation: SlugReservation = {
      slug,
      reservedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiration
    };

    this.reservedSlugs.add(slug);
    this.reservations.set(slug, reservation);
    
    return true;
  }

  /**
   * Release a reserved slug (useful for cleanup)
   */
  releaseSlug(slug: string): void {
    this.reservedSlugs.delete(slug);
    this.reservations.delete(slug);
  }

  /**
   * Clean up expired reservations
   */
  cleanupExpiredReservations(): void {
    const now = new Date();
    const expiredSlugs: string[] = [];

    for (const [slug, reservation] of this.reservations) {
      if (reservation.expiresAt < now) {
        expiredSlugs.push(slug);
      }
    }

    for (const slug of expiredSlugs) {
      this.releaseSlug(slug);
    }

    if (expiredSlugs.length > 0) {
      logger.info(` Cleaned up ${expiredSlugs.length} expired slug reservations`);
    }
  }

  /**
   * Get all currently reserved slugs
   */
  getReservedSlugs(): Set<string> {
    return new Set(this.reservedSlugs);
  }

  /**
   * Clear all reservations (useful for testing or reset)
   */
  clearAllReservations(): void {
    this.reservedSlugs.clear();
    this.reservations.clear();
  }

  /**
   * Create base slug from first and last name
   */
  private createBaseSlug(firstName: string, lastName: string): string {
    // Combine names and clean up
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (!fullName) {
      throw new Error('Cannot create slug from empty name');
    }

    // Convert to lowercase and replace spaces/special chars with hyphens
    let slug = fullName
      .toLowerCase()
      .trim()
      // Replace accented characters with their base equivalents
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Replace spaces and special characters with hyphens
      .replace(/[^a-z0-9]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-');

    // Ensure minimum length
    if (slug.length < 3) {
      slug = `user-${slug}`;
    }

    // Ensure maximum length
    if (slug.length > 50) {
      slug = slug.substring(0, 50).replace(/-+$/, '');
    }

    return slug;
  }

  /**
   * Generate slug from email if name-based slug fails
   */
  generateSlugFromEmail(email: string): string {
    const username = email.split('@')[0];
    return this.createBaseSlug(username, '');
  }

  /**
   * Batch generate slugs for multiple users
   */
  async batchGenerateSlugs(users: Array<{ firstName: string; lastName: string; email?: string }>): Promise<string[]> {
    const slugs: string[] = [];
    
    for (const user of users) {
      try {
        const slug = await this.generateUserSlug(user.firstName, user.lastName);
        slugs.push(slug);
      } catch (error) {
        // Fallback to email-based slug if name-based fails
        if (user.email) {
          logger.warn(`Failed to generate slug from name for ${user.firstName} ${user.lastName}, using email fallback`);
          const emailSlug = this.generateSlugFromEmail(user.email);
          const uniqueEmailSlug = this.ensureUniqueness(emailSlug, this.reservedSlugs);
          await this.reserveSlug(uniqueEmailSlug);
          slugs.push(uniqueEmailSlug);
        } else {
          throw error;
        }
      }
    }

    return slugs;
  }

  /**
   * Validate a batch of slugs for conflicts
   */
  validateSlugBatch(slugs: string[]): { valid: string[]; conflicts: string[]; invalid: string[] } {
    const valid: string[] = [];
    const conflicts: string[] = [];
    const invalid: string[] = [];
    const seenSlugs = new Set<string>();

    for (const slug of slugs) {
      if (!this.validateSlugFormat(slug)) {
        invalid.push(slug);
      } else if (seenSlugs.has(slug) || this.reservedSlugs.has(slug)) {
        conflicts.push(slug);
      } else {
        valid.push(slug);
        seenSlugs.add(slug);
      }
    }

    return { valid, conflicts, invalid };
  }
}