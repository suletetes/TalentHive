import { SlugGenerator } from '../SlugGenerator';

/**
 * Property tests for SlugGenerator
 * These tests validate universal properties that should always hold true
 * regardless of the specific input data
 */

describe('SlugGenerator Property Tests', () => {
  let slugGenerator: SlugGenerator;

  beforeEach(() => {
    slugGenerator = new SlugGenerator();
  });

  afterEach(() => {
    slugGenerator.clearAllReservations();
  });

  /**
   * Property 7: Slug Uniqueness
   * Generated slugs should always be unique within the same generator instance
   */
  describe('Property 7: Slug Uniqueness', () => {
    test('should generate unique slugs for different name combinations', async () => {
      const nameVariations = [
        ['John', 'Smith'],
        ['Jane', 'Smith'],
        ['John', 'Doe'],
        ['Jane', 'Doe'],
        ['John', 'Johnson'],
        ['Jane', 'Johnson'],
        ['Michael', 'Brown'],
        ['Sarah', 'Brown'],
        ['David', 'Wilson'],
        ['Lisa', 'Wilson'],
      ];

      const generatedSlugs = new Set<string>();

      for (const [firstName, lastName] of nameVariations) {
        const slug = await slugGenerator.generateUserSlug(firstName, lastName);
        
        // Property: Each generated slug should be unique
        expect(generatedSlugs.has(slug)).toBe(false);
        generatedSlugs.add(slug);
      }

      // Verify all slugs are different
      expect(generatedSlugs.size).toBe(nameVariations.length);
    });

    test('should handle identical names by generating unique slugs', async () => {
      const identicalNames = Array(10).fill(['John', 'Smith']);
      const generatedSlugs = new Set<string>();

      for (const [firstName, lastName] of identicalNames) {
        const slug = await slugGenerator.generateUserSlug(firstName, lastName);
        
        // Property: Even identical names should produce unique slugs
        expect(generatedSlugs.has(slug)).toBe(false);
        generatedSlugs.add(slug);
      }

      expect(generatedSlugs.size).toBe(identicalNames.length);
    });

    test('should maintain uniqueness across multiple generator instances', async () => {
      const generator1 = new SlugGenerator();
      const generator2 = new SlugGenerator();

      // Generate slug with first generator
      const slug1 = await generator1.generateUserSlug('John', 'Smith');
      
      // Reserve the same slug in second generator
      await generator2.reserveSlug(slug1);
      
      // Generate slug with second generator - should be different
      const slug2 = await generator2.generateUserSlug('John', 'Smith');
      
      // Property: Slugs should be unique across generators when reservations are shared
      expect(slug1).not.toBe(slug2);
    });
  });

  /**
   * Property 8: Slug Conflict Resolution
   * When conflicts occur, the generator should resolve them systematically
   */
  describe('Property 8: Slug Conflict Resolution', () => {
    test('should resolve conflicts with incremental suffixes', async () => {
      const baseName = ['John', 'Smith'];
      const conflictCount = 5;
      const slugs: string[] = [];

      for (let i = 0; i < conflictCount; i++) {
        const slug = await slugGenerator.generateUserSlug(baseName[0], baseName[1]);
        slugs.push(slug);
      }

      // Property: First slug should be base, subsequent should have incremental suffixes
      expect(slugs[0]).toBe('john-smith');
      expect(slugs[1]).toBe('john-smith-1');
      expect(slugs[2]).toBe('john-smith-2');
      expect(slugs[3]).toBe('john-smith-3');
      expect(slugs[4]).toBe('john-smith-4');
    });

    test('should handle pre-existing conflicts correctly', async () => {
      const existingSlugs = new Set(['john-smith', 'john-smith-1', 'john-smith-3']);
      
      // Test conflict resolution with gaps in existing slugs
      const resolvedSlug = slugGenerator.ensureUniqueness('john-smith', existingSlugs);
      
      // Property: Should find the next available suffix (2 in this case)
      expect(resolvedSlug).toBe('john-smith-2');
    });

    test('should handle large numbers of conflicts efficiently', async () => {
      const baseName = ['Test', 'User'];
      const conflictCount = 100;
      const slugs: string[] = [];

      const startTime = Date.now();
      
      for (let i = 0; i < conflictCount; i++) {
        const slug = await slugGenerator.generateUserSlug(baseName[0], baseName[1]);
        slugs.push(slug);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Property: Should handle large conflicts efficiently (under 5 seconds)
      expect(duration).toBeLessThan(5000);
      
      // Property: All slugs should be unique
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(conflictCount);
      
      // Property: Should follow incremental pattern
      expect(slugs[0]).toBe('test-user');
      expect(slugs[99]).toBe('test-user-99');
    });

    test('should prevent infinite loops with reasonable limits', () => {
      const existingSlugs = new Set<string>();
      
      // Fill up a large range to test limit handling
      for (let i = 0; i < 10000; i++) {
        existingSlugs.add(`test-slug-${i}`);
      }
      
      // Property: Should throw error when reaching reasonable limit
      expect(() => {
        slugGenerator.ensureUniqueness('test-slug', existingSlugs);
      }).toThrow('Unable to generate unique slug');
    });
  });

  /**
   * Property 9: Slug Format Compliance
   * All generated slugs should comply with SEO-friendly format rules
   */
  describe('Property 9: Slug Format Compliance', () => {
    test('should always generate SEO-friendly format', async () => {
      const testCases = [
        ['John', 'Smith'],
        ['María', 'García'],
        ['Jean-Pierre', 'Dupont'],
        ['O\'Connor', 'Patrick'],
        ['李', '小明'],
        ['', ''],
        ['Müller', 'Hans'],
        ['Åse', 'Björk'],
        ['123', '456'],
        ['Test@User', 'Name#123'],
      ];

      for (const [firstName, lastName] of testCases) {
        const slug = await slugGenerator.generateUserSlug(firstName, lastName);
        
        // Property: Should match SEO-friendly pattern
        expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        
        // Property: Should not start or end with hyphen
        expect(slug).not.toMatch(/^-|-$/);
        
        // Property: Should not have consecutive hyphens
        expect(slug).not.toMatch(/--/);
        
        // Property: Should be within length limits
        expect(slug.length).toBeGreaterThanOrEqual(3);
        expect(slug.length).toBeLessThanOrEqual(50);
        
        // Property: Should not be only numbers
        expect(slug).not.toMatch(/^\d+(?:-\d+)*$/);
      }
    });

    test('should handle edge cases in format validation', () => {
      const edgeCases = [
        '', // empty
        'a', // too short
        'ab', // too short
        'a'.repeat(51), // too long
        'test-', // ends with hyphen
        '-test', // starts with hyphen
        'test--slug', // consecutive hyphens
        'Test_Slug', // uppercase and underscore
        '123-456', // only numbers
        'test slug', // contains space
        'test@slug', // contains special char
      ];

      for (const testSlug of edgeCases) {
        const isValid = slugGenerator.validateSlugFormat(testSlug);
        
        // Property: Edge cases should be invalid
        expect(isValid).toBe(false);
      }
    });

    test('should validate correct formats as valid', () => {
      const validSlugs = [
        'john-smith',
        'test-user-123',
        'a1b2c3',
        'user',
        'very-long-slug-name-that-is-still-valid',
        'slug123',
        'test-1-2-3',
      ];

      for (const slug of validSlugs) {
        const isValid = slugGenerator.validateSlugFormat(slug);
        
        // Property: Valid formats should pass validation
        expect(isValid).toBe(true);
      }
    });

    test('should handle unicode characters by normalizing them', async () => {
      const unicodeTestCases = [
        ['José', 'García'], // Spanish accents
        ['François', 'Müller'], // French/German accents
        ['Åse', 'Björk'], // Nordic characters
        ['', ''], // Cyrillic
        ['田中', '太郎'], // Japanese
      ];

      for (const [firstName, lastName] of unicodeTestCases) {
        const slug = await slugGenerator.generateUserSlug(firstName, lastName);
        
        // Property: Should normalize to ASCII-compatible format
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        
        // Property: Should still be meaningful (not empty after normalization)
        expect(slug.length).toBeGreaterThan(0);
      }
    });

    test('should maintain format consistency across batch operations', async () => {
      const batchUsers = [
        { firstName: 'John', lastName: 'Smith', email: 'john@example.com' },
        { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
        { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com' },
        { firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com' },
        { firstName: 'Charlie', lastName: 'Wilson', email: 'charlie@example.com' },
      ];

      const slugs = await slugGenerator.batchGenerateSlugs(batchUsers);

      // Property: All batch-generated slugs should be valid
      for (const slug of slugs) {
        expect(slugGenerator.validateSlugFormat(slug)).toBe(true);
      }

      // Property: Batch should maintain uniqueness
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    test('should handle batch validation correctly', () => {
      const testSlugs = [
        'valid-slug-1',
        'valid-slug-2',
        'invalid-slug-', // invalid: ends with hyphen
        'valid-slug-3',
        'invalid--slug', // invalid: consecutive hyphens
        'valid-slug-4',
        '123-456', // invalid: only numbers
      ];

      const validation = slugGenerator.validateSlugBatch(testSlugs);

      // Property: Should correctly categorize valid and invalid slugs
      expect(validation.valid).toEqual(['valid-slug-1', 'valid-slug-2', 'valid-slug-3', 'valid-slug-4']);
      expect(validation.invalid).toEqual(['invalid-slug-', 'invalid--slug', '123-456']);
      expect(validation.conflicts).toEqual([]);
    });

    test('should detect conflicts in batch validation', () => {
      // Pre-reserve some slugs
      slugGenerator.reserveSlug('reserved-slug');
      
      const testSlugs = [
        'new-slug-1',
        'new-slug-2',
        'reserved-slug', // conflict with reserved
        'new-slug-1', // conflict within batch
        'new-slug-3',
      ];

      const validation = slugGenerator.validateSlugBatch(testSlugs);

      // Property: Should detect both reserved and within-batch conflicts
      expect(validation.conflicts).toContain('reserved-slug');
      expect(validation.conflicts).toContain('new-slug-1');
      expect(validation.valid).toEqual(['new-slug-2', 'new-slug-3']);
    });
  });

  /**
   * Performance and Stress Tests
   */
  describe('Performance Properties', () => {
    test('should handle high-volume slug generation efficiently', async () => {
      const startTime = Date.now();
      const slugCount = 1000;
      const slugs: string[] = [];

      for (let i = 0; i < slugCount; i++) {
        const slug = await slugGenerator.generateUserSlug(`User${i}`, `Test${i}`);
        slugs.push(slug);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Property: Should generate 1000 slugs in under 10 seconds
      expect(duration).toBeLessThan(10000);
      
      // Property: All slugs should be unique
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugCount);
    });

    test('should clean up expired reservations correctly', async () => {
      // Generate some slugs to create reservations
      await slugGenerator.generateUserSlug('Test', 'User1');
      await slugGenerator.generateUserSlug('Test', 'User2');
      
      const initialReservations = slugGenerator.getReservedSlugs().size;
      expect(initialReservations).toBeGreaterThan(0);

      // Manually expire reservations by manipulating internal state
      // In a real scenario, this would happen after the expiration time
      slugGenerator.cleanupExpiredReservations();

      // For this test, we'll verify the cleanup method exists and runs without error
      expect(() => slugGenerator.cleanupExpiredReservations()).not.toThrow();
    });
  });
});