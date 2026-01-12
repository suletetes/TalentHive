import { UserGenerator } from '../UserGenerator';
import { GenerationContext, SeedConfiguration } from '../types';

/**
 * Property tests for UserGenerator
 * These tests validate universal properties that should always hold true
 * for user generation regardless of specific input data
 */

describe('UserGenerator Property Tests', () => {
  let userGenerator: UserGenerator;
  let mockContext: GenerationContext;

  beforeEach(() => {
    userGenerator = new UserGenerator();
    
    // Create mock context
    const mockConfig: SeedConfiguration = {
      environment: 'testing',
      userCounts: {
        admins: 2,
        clients: 5,
        freelancers: 10,
      },
      projectCounts: {
        draft: 2,
        open: 5,
        inProgress: 3,
        completed: 4,
        cancelled: 1,
      },
      enableModules: ['foundation', 'users', 'projects'],
      batchSize: 25,
      skipExisting: false,
    };

    mockContext = {
      existingData: new Map(),
      configuration: mockConfig,
      dependencies: [],
    };
  });

  /**
   * Property 1: Realistic Skill Combinations
   * Freelancer skills should form realistic, coherent combinations
   */
  describe('Property 1: Realistic Skill Combinations', () => {
    test('should generate coherent skill combinations for freelancers', async () => {
      const freelancers = await userGenerator.generateFreelancers(20, mockContext);

      for (const freelancer of freelancers) {
        const profile = freelancer.freelancerProfile!;
        
        // Property: Skills should be related to the freelancer's title
        const title = profile.title;
        const skills = profile.skills;
        
        expect(skills.length).toBeGreaterThan(0);
        expect(skills.length).toBeLessThanOrEqual(15); // Reasonable skill count
        
        // Property: Skills should contain core technologies for the role
        if (title.includes('Developer') || title.includes('Engineer')) {
          const hasProgLanguage = skills.some(skill => 
            ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust'].includes(skill)
          );
          expect(hasProgLanguage).toBe(true);
        }
        
        if (title.includes('Frontend')) {
          const hasFrontendSkills = skills.some(skill => 
            ['React', 'Vue.js', 'Angular', 'HTML/CSS'].includes(skill)
          );
          expect(hasFrontendSkills).toBe(true);
        }
        
        if (title.includes('Backend')) {
          const hasBackendSkills = skills.some(skill => 
            ['Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'REST API'].includes(skill)
          );
          expect(hasBackendSkills).toBe(true);
        }
        
        if (title.includes('Designer')) {
          const hasDesignSkills = skills.some(skill => 
            ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'].includes(skill)
          );
          expect(hasDesignSkills).toBe(true);
        }
        
        if (title.includes('Data')) {
          const hasDataSkills = skills.some(skill => 
            ['Python', 'SQL', 'Machine Learning', 'Data Analysis'].includes(skill)
          );
          expect(hasDataSkills).toBe(true);
        }
        
        // Property: No duplicate skills
        const uniqueSkills = new Set(skills);
        expect(uniqueSkills.size).toBe(skills.length);
      }
    });

    test('should generate skills appropriate for experience level', async () => {
      const freelancers = await userGenerator.generateFreelancers(30, mockContext);

      for (const freelancer of freelancers) {
        const profile = freelancer.freelancerProfile!;
        const hourlyRate = profile.hourlyRate;
        const skills = profile.skills;
        
        // Property: Higher rates should correlate with more skills
        if (hourlyRate >= 100) { // Senior/Expert level
          expect(skills.length).toBeGreaterThanOrEqual(6);
        } else if (hourlyRate >= 60) { // Mid level
          expect(skills.length).toBeGreaterThanOrEqual(4);
        } else { // Junior level
          expect(skills.length).toBeGreaterThanOrEqual(3);
        }
        
        // Property: Skills should not exceed reasonable limits
        expect(skills.length).toBeLessThanOrEqual(15);
      }
    });

    test('should maintain skill coherence across portfolio items', async () => {
      const freelancers = await userGenerator.generateFreelancers(15, mockContext);

      for (const freelancer of freelancers) {
        const profile = freelancer.freelancerProfile!;
        const skills = profile.skills;
        const portfolio = profile.portfolio;
        
        // Property: Portfolio technologies should overlap with freelancer skills
        for (const item of portfolio) {
          const portfolioTechs = item.technologies;
          const hasOverlap = portfolioTechs.some(tech => skills.includes(tech));
          
          // At least some portfolio technologies should match freelancer skills
          expect(hasOverlap).toBe(true);
        }
      }
    });
  });

  /**
   * Property 3: Rate-Experience Correlation
   * Hourly rates should correlate with experience level and location
   */
  describe('Property 3: Rate-Experience Correlation', () => {
    test('should correlate rates with experience levels', async () => {
      const freelancers = await userGenerator.generateFreelancers(50, mockContext);

      // Group by rate ranges to determine experience levels
      const juniorRates: number[] = [];
      const midRates: number[] = [];
      const seniorRates: number[] = [];
      const expertRates: number[] = [];

      for (const freelancer of freelancers) {
        const rate = freelancer.freelancerProfile!.hourlyRate;
        
        if (rate < 40) juniorRates.push(rate);
        else if (rate < 70) midRates.push(rate);
        else if (rate < 120) seniorRates.push(rate);
        else expertRates.push(rate);
      }

      // Property: Rate ranges should follow experience progression
      if (juniorRates.length > 0 && midRates.length > 0) {
        const avgJunior = juniorRates.reduce((sum, rate) => sum + rate, 0) / juniorRates.length;
        const avgMid = midRates.reduce((sum, rate) => sum + rate, 0) / midRates.length;
        expect(avgMid).toBeGreaterThan(avgJunior);
      }

      if (midRates.length > 0 && seniorRates.length > 0) {
        const avgMid = midRates.reduce((sum, rate) => sum + rate, 0) / midRates.length;
        const avgSenior = seniorRates.reduce((sum, rate) => sum + rate, 0) / seniorRates.length;
        expect(avgSenior).toBeGreaterThan(avgMid);
      }

      if (seniorRates.length > 0 && expertRates.length > 0) {
        const avgSenior = seniorRates.reduce((sum, rate) => sum + rate, 0) / seniorRates.length;
        const avgExpert = expertRates.reduce((sum, rate) => sum + rate, 0) / expertRates.length;
        expect(avgExpert).toBeGreaterThan(avgSenior);
      }
    });

    test('should apply location-based rate adjustments', async () => {
      const freelancers = await userGenerator.generateFreelancers(40, mockContext);

      // Group by high-cost and low-cost locations
      const highCostRates: number[] = [];
      const lowCostRates: number[] = [];

      for (const freelancer of freelancers) {
        const location = freelancer.profile.location;
        const rate = freelancer.freelancerProfile!.hourlyRate;

        // High-cost locations
        if (location.includes('San Francisco') || location.includes('New York') || location.includes('Seattle')) {
          highCostRates.push(rate);
        }
        // Low-cost locations
        else if (location.includes('Phoenix') || location.includes('Detroit') || location.includes('San Antonio')) {
          lowCostRates.push(rate);
        }
      }

      // Property: High-cost locations should have higher average rates
      if (highCostRates.length > 0 && lowCostRates.length > 0) {
        const avgHighCost = highCostRates.reduce((sum, rate) => sum + rate, 0) / highCostRates.length;
        const avgLowCost = lowCostRates.reduce((sum, rate) => sum + rate, 0) / lowCostRates.length;
        
        expect(avgHighCost).toBeGreaterThan(avgLowCost);
      }
    });

    test('should maintain reasonable rate bounds', async () => {
      const freelancers = await userGenerator.generateFreelancers(30, mockContext);

      for (const freelancer of freelancers) {
        const rate = freelancer.freelancerProfile!.hourlyRate;
        
        // Property: Rates should be within realistic bounds
        expect(rate).toBeGreaterThanOrEqual(15); // Minimum wage consideration
        expect(rate).toBeLessThanOrEqual(500); // Maximum reasonable rate
        
        // Property: Rates should be reasonable numbers (not extreme outliers)
        expect(rate % 1).toBe(0); // Should be whole numbers
      }
    });

    test('should correlate rates with skill count and complexity', async () => {
      const freelancers = await userGenerator.generateFreelancers(25, mockContext);

      // Analyze correlation between skills and rates
      const skillRateData = freelancers.map(f => ({
        skillCount: f.freelancerProfile!.skills.length,
        rate: f.freelancerProfile!.hourlyRate,
        hasHighValueSkills: f.freelancerProfile!.skills.some(skill => 
          ['Blockchain', 'Machine Learning', 'Cybersecurity', 'DevOps'].includes(skill)
        ),
      }));

      // Property: More skills should generally correlate with higher rates
      const highSkillCount = skillRateData.filter(d => d.skillCount >= 8);
      const lowSkillCount = skillRateData.filter(d => d.skillCount <= 4);

      if (highSkillCount.length > 0 && lowSkillCount.length > 0) {
        const avgHighSkillRate = highSkillCount.reduce((sum, d) => sum + d.rate, 0) / highSkillCount.length;
        const avgLowSkillRate = lowSkillCount.reduce((sum, d) => sum + d.rate, 0) / lowSkillCount.length;
        
        expect(avgHighSkillRate).toBeGreaterThanOrEqual(avgLowSkillRate);
      }

      // Property: High-value skills should command premium rates
      const highValueSkills = skillRateData.filter(d => d.hasHighValueSkills);
      const regularSkills = skillRateData.filter(d => !d.hasHighValueSkills);

      if (highValueSkills.length > 0 && regularSkills.length > 0) {
        const avgHighValueRate = highValueSkills.reduce((sum, d) => sum + d.rate, 0) / highValueSkills.length;
        const avgRegularRate = regularSkills.reduce((sum, d) => sum + d.rate, 0) / regularSkills.length;
        
        expect(avgHighValueRate).toBeGreaterThanOrEqual(avgRegularRate);
      }
    });
  });

  /**
   * Data Quality and Consistency Tests
   */
  describe('Data Quality Properties', () => {
    test('should generate unique emails and slugs', async () => {
      const users = await userGenerator.generate(17, mockContext); // Total from config

      const emails = users.map(u => u.email);
      const slugs = users.map(u => u.profile.slug);

      // Property: All emails should be unique
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(emails.length);

      // Property: All slugs should be unique
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    test('should generate valid email formats', async () => {
      const users = await userGenerator.generate(17, mockContext);

      for (const user of users) {
        // Property: All emails should be valid format
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        
        // Property: Admin emails should follow pattern
        if (user.role === 'admin') {
          expect(user.email).toMatch(/admin.*@talenthive\.com/);
        }
      }
    });

    test('should generate appropriate user distributions', async () => {
      const users = await userGenerator.generate(17, mockContext);

      const admins = users.filter(u => u.role === 'admin');
      const clients = users.filter(u => u.role === 'client');
      const freelancers = users.filter(u => u.role === 'freelancer');

      // Property: Should match configuration counts
      expect(admins.length).toBe(mockContext.configuration.userCounts.admins);
      expect(clients.length).toBe(mockContext.configuration.userCounts.clients);
      expect(freelancers.length).toBe(mockContext.configuration.userCounts.freelancers);
    });

    test('should generate complete freelancer profiles', async () => {
      const freelancers = await userGenerator.generateFreelancers(10, mockContext);

      for (const freelancer of freelancers) {
        const profile = freelancer.freelancerProfile!;
        
        // Property: All required fields should be present
        expect(profile.title).toBeTruthy();
        expect(profile.hourlyRate).toBeGreaterThan(0);
        expect(profile.skills).toBeDefined();
        expect(profile.skills.length).toBeGreaterThan(0);
        expect(profile.experience).toBeTruthy();
        expect(profile.availability).toBeDefined();
        expect(profile.portfolio).toBeDefined();
        expect(profile.certifications).toBeDefined();
        expect(profile.workExperience).toBeDefined();
        expect(profile.education).toBeDefined();
        expect(profile.languages).toBeDefined();
        
        // Property: Portfolio should have reasonable content
        expect(profile.portfolio.length).toBeGreaterThanOrEqual(2);
        expect(profile.portfolio.length).toBeLessThanOrEqual(8);
        
        // Property: Work experience should be chronologically consistent
        const workExp = profile.workExperience;
        for (let i = 1; i < workExp.length; i++) {
          expect(workExp[i].startDate.getTime()).toBeGreaterThanOrEqual(workExp[i-1].startDate.getTime());
        }
        
        // Property: Education should have valid dates
        for (const edu of profile.education) {
          expect(edu.endDate.getTime()).toBeGreaterThan(edu.startDate.getTime());
        }
        
        // Property: Should have at least English language
        const hasEnglish = profile.languages.some(lang => lang.language === 'English');
        expect(hasEnglish).toBe(true);
      }
    });

    test('should maintain data consistency across generations', async () => {
      // Generate users multiple times and check consistency
      const generation1 = await userGenerator.generateFreelancers(5, mockContext);
      const generation2 = await userGenerator.generateFreelancers(5, mockContext);

      // Property: Different generations should have different data but same structure
      const gen1Emails = generation1.map(u => u.email);
      const gen2Emails = generation2.map(u => u.email);
      
      // Should be different users
      const emailOverlap = gen1Emails.filter(email => gen2Emails.includes(email));
      expect(emailOverlap.length).toBe(0);

      // But same data structure and quality
      for (const user of [...generation1, ...generation2]) {
        expect(user.freelancerProfile).toBeDefined();
        expect(user.profile.slug).toBeTruthy();
        expect(user.freelancerProfile!.hourlyRate).toBeGreaterThan(0);
      }
    });
  });

  /**
   * Validation Properties
   */
  describe('Validation Properties', () => {
    test('should pass validation for well-formed data', async () => {
      const users = await userGenerator.generate(17, mockContext);
      const validation = userGenerator.validate(users);

      // Property: Valid data should pass validation
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should detect validation errors in malformed data', () => {
      const invalidUsers = [
        {
          email: 'invalid-email', // Invalid email
          password: 'password',
          role: 'freelancer' as const,
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            slug: 'john-doe',
            bio: 'Test bio',
            location: 'Test Location',
          },
          rating: { average: 0, count: 0 },
          isVerified: true,
        },
        {
          email: 'valid@email.com',
          password: '', // Missing password
          role: 'client' as const,
          profile: {
            firstName: '',
            lastName: 'Doe', // Missing first name
            slug: 'doe',
            bio: 'Test bio',
            location: 'Test Location',
          },
          rating: { average: 0, count: 0 },
          isVerified: true,
        },
      ];

      const validation = userGenerator.validate(invalidUsers);

      // Property: Invalid data should fail validation
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should detect duplicate emails and slugs', () => {
      const duplicateUsers = [
        {
          email: 'duplicate@email.com',
          password: 'password',
          role: 'freelancer' as const,
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            slug: 'john-doe',
            bio: 'Test bio',
            location: 'Test Location',
          },
          rating: { average: 0, count: 0 },
          isVerified: true,
        },
        {
          email: 'duplicate@email.com', // Duplicate email
          password: 'password',
          role: 'client' as const,
          profile: {
            firstName: 'Jane',
            lastName: 'Smith',
            slug: 'john-doe', // Duplicate slug
            bio: 'Test bio',
            location: 'Test Location',
          },
          rating: { average: 0, count: 0 },
          isVerified: true,
        },
      ];

      const validation = userGenerator.validate(duplicateUsers);

      // Property: Duplicates should be detected
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Duplicate email'))).toBe(true);
      expect(validation.errors.some(error => error.includes('Duplicate slug'))).toBe(true);
    });
  });
});