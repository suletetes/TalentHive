import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';
import { 
  UserData, 
  UserGenerator as IUserGenerator, 
  GenerationContext, 
  ValidationResult,
  ExperienceLevel,
  FreelancerProfileData,
  WorkExperience,
  Education,
  Language
} from './types';
import { SlugGenerator } from './SlugGenerator';
import { 
  MARKET_DATA,
  REALISTIC_SKILL_COMBINATIONS,
  generateRealisticHourlyRate,
  generateRealisticSkillSet,
  generatePortfolioWithMetrics,
  generateRelevantCertifications,
  generateRealisticAvailability
} from '../realisticDataGenerators';

/**
 * Generates realistic user data with market-based rates and automatic slug generation
 * Integrates with existing realistic data generators while providing consolidated interface
 */
export class UserGenerator implements IUserGenerator {
  private slugGenerator: SlugGenerator;
  private hashedPassword: string | null = null;

  constructor() {
    this.slugGenerator = new SlugGenerator();
  }

  /**
   * Generate users of all types
   */
  async generate(count: number, context: GenerationContext): Promise<UserData[]> {
    const { userCounts } = context.configuration;
    const totalRequested = userCounts.admins + userCounts.clients + userCounts.freelancers;
    
    if (count !== totalRequested) {
      logger.warn(`Requested count (${count}) doesn't match configuration total (${totalRequested}). Using configuration.`);
    }

    const users: UserData[] = [];

    // Generate users in order: admins, clients, freelancers
    const admins = await this.generateAdmins(userCounts.admins, context);
    const clients = await this.generateClients(userCounts.clients, context);
    const freelancers = await this.generateFreelancers(userCounts.freelancers, context);

    users.push(...admins, ...clients, ...freelancers);

    logger.info(` Generated ${users.length} users (${admins.length} admins, ${clients.length} clients, ${freelancers.length} freelancers)`);
    return users;
  }

  /**
   * Generate admin users
   */
  async generateAdmins(count: number, _context: GenerationContext): Promise<UserData[]> {
    logger.info(` Generating ${count} admin users...`);
    
    const admins: UserData[] = [];
    const password = await this.getHashedPassword();
    
    // Check if admin@talenthive.com already exists
    const { User } = await import('@/models/User');
    const existingAdmin = await User.findOne({ email: 'admin@talenthive.com' });
    
    let startIndex = 0;
    if (existingAdmin) {
      logger.info(' Admin user already exists, skipping creation');
      startIndex = 1; // Skip the first admin creation
      count = count - 1; // Reduce count by 1
    }

    for (let i = startIndex; i < count + startIndex; i++) {
      const firstName = this.getRandomFirstName();
      const lastName = this.getRandomLastName();
      const slug = await this.slugGenerator.generateUserSlug(firstName, lastName);

      const admin: UserData = {
        email: i === 0 && !existingAdmin ? 'admin@talenthive.com' : `admin${i + 1}@talenthive.com`,
        password,
        role: 'admin',
        profile: {
          firstName,
          lastName,
          slug,
          bio: `Platform administrator with expertise in ${this.getRandomAdminExpertise()}`,
          location: this.getRandomLocation(),
          timezone: this.getTimezoneForLocation(this.getRandomLocation()),
        },
        rating: { average: 0, count: 0 },
        isVerified: true,
      };

      admins.push(admin);
    }

    return admins;
  }

  /**
   * Generate client users with business profiles
   */
  async generateClients(count: number, _context: GenerationContext): Promise<UserData[]> {
    logger.info(` Generating ${count} client users...`);
    
    const clients: UserData[] = [];
    const password = await this.getHashedPassword();

    for (let i = 0; i < count; i++) {
      const firstName = this.getRandomFirstName();
      const lastName = this.getRandomLastName();
      const slug = await this.slugGenerator.generateUserSlug(firstName, lastName);
      const location = this.getRandomLocation();
      const companyType = this.getRandomCompanyType();

      const client: UserData = {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${this.generateCompanyDomain(companyType)}`,
        password,
        role: 'client',
        profile: {
          firstName,
          lastName,
          slug,
          bio: this.generateClientBio(companyType, location),
          location,
          timezone: this.getTimezoneForLocation(location),
          website: `https://www.${this.generateCompanyDomain(companyType)}`,
        },
        rating: { average: 0, count: 0 },
        isVerified: Math.random() > 0.2, // 80% verified
      };

      clients.push(client);
    }

    return clients;
  }

  /**
   * Generate freelancer users with complete profiles and market-based data
   */
  async generateFreelancers(count: number, _context: GenerationContext): Promise<UserData[]> {
    logger.info(` Generating ${count} freelancer users with market-based profiles...`);
    
    const freelancers: UserData[] = [];
    const password = await this.getHashedPassword();

    for (let i = 0; i < count; i++) {
      const firstName = this.getRandomFirstName();
      const lastName = this.getRandomLastName();
      const slug = await this.slugGenerator.generateUserSlug(firstName, lastName);
      const location = this.getRandomLocation();
      
      // Generate freelancer profile with market data
      const freelancerProfile = await this.generateFreelancerProfile(location);
      
      const freelancer: UserData = {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${this.getRandomEmailDomain()}`,
        password,
        role: 'freelancer',
        profile: {
          firstName,
          lastName,
          slug,
          bio: this.generateFreelancerBio(freelancerProfile),
          location,
          timezone: this.getTimezoneForLocation(location),
          website: Math.random() > 0.7 ? `https://www.${firstName.toLowerCase()}${lastName.toLowerCase()}.dev` : undefined,
        },
        freelancerProfile,
        rating: { average: 0, count: 0 }, // Will be updated after reviews are created
        isVerified: Math.random() > 0.3, // 70% verified
        isFeatured: Math.random() > 0.9, // 10% featured
        featuredOrder: Math.random() > 0.9 ? Math.floor(Math.random() * 10) + 1 : undefined,
      };

      freelancers.push(freelancer);
    }

    // Mark some top freelancers as featured
    const topFreelancers = freelancers
      .filter(f => f.freelancerProfile)
      .sort((a, b) => (b.freelancerProfile!.hourlyRate || 0) - (a.freelancerProfile!.hourlyRate || 0))
      .slice(0, Math.min(5, Math.floor(count * 0.1)));

    topFreelancers.forEach((freelancer, index) => {
      freelancer.isFeatured = true;
      freelancer.featuredOrder = index + 1;
    });

    return freelancers;
  }

  /**
   * Validate generated user data
   */
  validate(data: UserData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const user = data[i];
      const prefix = `User ${i + 1}`;

      // Required fields validation
      if (!user.email || !user.email.includes('@')) {
        errors.push(`${prefix}: Invalid email format`);
      }
      if (!user.password) {
        errors.push(`${prefix}: Password is required`);
      }
      if (!['admin', 'client', 'freelancer'].includes(user.role)) {
        errors.push(`${prefix}: Invalid role`);
      }
      if (!user.profile.firstName || !user.profile.lastName) {
        errors.push(`${prefix}: First name and last name are required`);
      }
      if (!user.profile.slug) {
        errors.push(`${prefix}: Slug is required`);
      }

      // Freelancer-specific validation
      if (user.role === 'freelancer') {
        if (!user.freelancerProfile) {
          errors.push(`${prefix}: Freelancer profile is required for freelancers`);
        } else {
          const profile = user.freelancerProfile;
          if (!profile.title || !profile.hourlyRate || !profile.skills || profile.skills.length === 0) {
            errors.push(`${prefix}: Freelancer profile missing required fields`);
          }
          if (profile.hourlyRate < 10 || profile.hourlyRate > 500) {
            warnings.push(`${prefix}: Hourly rate seems unrealistic (${profile.hourlyRate})`);
          }
        }
      }

      // Email uniqueness check
      const duplicateEmails = data.filter(u => u.email === user.email);
      if (duplicateEmails.length > 1) {
        errors.push(`${prefix}: Duplicate email ${user.email}`);
      }

      // Slug uniqueness check
      const duplicateSlugs = data.filter(u => u.profile.slug === user.profile.slug);
      if (duplicateSlugs.length > 1) {
        errors.push(`${prefix}: Duplicate slug ${user.profile.slug}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get dependencies for user generation
   */
  getDependencies(): string[] {
    return []; // Users don't depend on other entities
  }

  /**
   * Generate comprehensive freelancer profile with market-based data
   */
  private async generateFreelancerProfile(location: string): Promise<FreelancerProfileData> {
    const title = this.getRandomFreelancerTitle();
    const experienceLevel = this.getRandomExperienceLevel();
    const experienceYears = this.getExperienceYears(experienceLevel);
    
    // Generate realistic skill set
    const skills = generateRealisticSkillSet(title, experienceYears);
    
    // Calculate market-based hourly rate
    const category = this.getCategoryFromTitle(title);
    const hourlyRate = generateRealisticHourlyRate(category, experienceLevel, location, skills);
    
    // Generate portfolio with metrics
    const portfolio = generatePortfolioWithMetrics(skills, experienceLevel);
    
    // Generate certifications
    const certifications = generateRelevantCertifications(skills);
    
    // Generate work experience
    const workExperience = this.generateWorkExperience(title, experienceYears);
    
    // Generate education
    const education = this.generateEducation(title);
    
    // Generate languages
    const languages = this.generateLanguages(location);
    
    // Generate availability
    const availability = generateRealisticAvailability();

    return {
      title,
      hourlyRate,
      skills,
      experience: this.generateExperienceDescription(experienceYears, title),
      availability,
      portfolio,
      certifications,
      workExperience,
      education,
      languages,
    };
  }

  /**
   * Generate work experience based on title and years
   */
  private generateWorkExperience(title: string, experienceYears: number): WorkExperience[] {
    const experiences: WorkExperience[] = [];
    const jobCount = Math.min(4, Math.max(1, Math.floor(experienceYears / 2)));
    
    let currentDate = new Date();
    let remainingYears = experienceYears;

    for (let i = 0; i < jobCount; i++) {
      const yearsAtJob = Math.max(1, Math.floor(remainingYears / (jobCount - i)));
      const startDate = new Date(currentDate);
      startDate.setFullYear(startDate.getFullYear() - yearsAtJob);
      
      const isCurrent = i === 0 && Math.random() > 0.3; // 70% chance current job is current
      const endDate = isCurrent ? undefined : new Date(currentDate);

      experiences.push({
        title: this.getJobTitleVariation(title, i),
        company: this.getRandomCompanyName(),
        location: this.getRandomLocation(),
        startDate,
        endDate,
        current: isCurrent,
        description: this.generateJobDescription(title, yearsAtJob),
      });

      currentDate = startDate;
      remainingYears -= yearsAtJob;
    }

    return experiences.reverse(); // Chronological order
  }

  /**
   * Generate education background
   */
  private generateEducation(title: string): Education[] {
    const educationCount = Math.random() > 0.7 ? 2 : 1; // 30% have multiple degrees
    const education: Education[] = [];

    for (let i = 0; i < educationCount; i++) {
      const graduationYear = 2024 - Math.floor(Math.random() * 15) - 4; // Graduated 4-19 years ago
      const startYear = graduationYear - 4;

      education.push({
        degree: this.getRelevantDegree(title, i === 0),
        institution: this.getRandomUniversity(),
        fieldOfStudy: this.getRelevantFieldOfStudy(title),
        startDate: new Date(startYear, 8, 1), // September 1st
        endDate: new Date(graduationYear, 4, 15), // May 15th
        description: i === 0 ? this.generateEducationDescription(title) : undefined,
      });
    }

    return education;
  }

  /**
   * Generate languages based on location
   */
  private generateLanguages(location: string): Language[] {
    const languages: Language[] = [
      { language: 'English', proficiency: 'native' }
    ];

    // Add location-based languages
    if (location.includes('CA') || location.includes('Quebec')) {
      if (Math.random() > 0.5) {
        languages.push({ language: 'French', proficiency: 'fluent' });
      }
    }
    
    if (location.includes('TX') || location.includes('CA') || location.includes('FL')) {
      if (Math.random() > 0.6) {
        languages.push({ language: 'Spanish', proficiency: 'conversational' });
      }
    }

    // Add random additional languages
    const additionalLanguages = ['German', 'Portuguese', 'Italian', 'Japanese', 'Mandarin'];
    if (Math.random() > 0.7) {
      const randomLang = additionalLanguages[Math.floor(Math.random() * additionalLanguages.length)];
      const proficiency = Math.random() > 0.5 ? 'conversational' : 'basic';
      languages.push({ language: randomLang, proficiency: proficiency as any });
    }

    return languages;
  }

  /**
   * Get hashed password (cached for performance)
   */
  private async getHashedPassword(): Promise<string> {
    if (!this.hashedPassword) {
      this.hashedPassword = await bcrypt.hash('Password123!', 10);
    }
    return this.hashedPassword;
  }

  /**
   * Generate freelancer bio based on profile
   */
  private generateFreelancerBio(profile: FreelancerProfileData): string {
    const templates = [
      `Passionate ${profile.title.toLowerCase()} with ${this.getExperienceYears(this.getExperienceLevelFromRate(profile.hourlyRate))}+ years of experience. Specialized in ${profile.skills.slice(0, 3).join(', ')}. I love turning complex problems into elegant solutions and have successfully delivered ${Math.floor(Math.random() * 50) + 20}+ projects for clients worldwide.`,
      `${profile.title} with expertise in ${profile.skills.slice(0, 4).join(', ')}. ${this.getExperienceYears(this.getExperienceLevelFromRate(profile.hourlyRate))} years of professional experience building scalable solutions. Expert in modern development practices and committed to delivering high-quality results.`,
      `Award-winning ${profile.title.toLowerCase()} specializing in ${profile.skills.slice(0, 3).join(', ')}. ${this.getExperienceYears(this.getExperienceLevelFromRate(profile.hourlyRate))}+ years creating innovative digital experiences. My work focuses on user-centered design and cutting-edge technology.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate client bio based on company type and location
   */
  private generateClientBio(_companyType: string, location: string): string {
    const roles = ['CEO', 'CTO', 'Project Manager', 'Product Manager', 'Founder', 'Director'];
    const role = roles[Math.floor(Math.random() * roles.length)];
    
    return `${role} at ${_companyType} company based in ${location}. Looking for talented professionals to help grow our business and deliver exceptional results for our clients.`;
  }

  // Helper methods for data generation
  private getRandomFirstName(): string {
    const names = [
      'John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily',
      'James', 'Jessica', 'William', 'Ashley', 'Richard', 'Amanda', 'Joseph', 'Stephanie',
      'Thomas', 'Jennifer', 'Christopher', 'Elizabeth', 'Daniel', 'Dorothy', 'Matthew', 'Maria',
      'Anthony', 'Nancy', 'Mark', 'Karen', 'Donald', 'Betty', 'Steven', 'Helen',
      'Andrew', 'Sandra', 'Kenneth', 'Donna', 'Paul', 'Carol', 'Joshua', 'Ruth',
      'Kevin', 'Sharon', 'Brian', 'Michelle', 'George', 'Laura', 'Edward', 'Sarah',
      'Ronald', 'Kimberly', 'Timothy', 'Deborah', 'Jason', 'Dorothy', 'Jeffrey', 'Lisa',
      'Ryan', 'Nancy', 'Jacob', 'Karen', 'Gary', 'Betty', 'Nicholas', 'Helen',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomLastName(): string {
    const names = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
      'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
      'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
      'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomLocation(): string {
    const locations = Object.keys(MARKET_DATA.locationMultipliers);
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private getTimezoneForLocation(location: string): string {
    const timezoneMap: Record<string, string> = {
      'San Francisco, CA': 'America/Los_Angeles',
      'Los Angeles, CA': 'America/Los_Angeles',
      'San Diego, CA': 'America/Los_Angeles',
      'Portland, OR': 'America/Los_Angeles',
      'Seattle, WA': 'America/Los_Angeles',
      'Denver, CO': 'America/Denver',
      'Phoenix, AZ': 'America/Phoenix',
      'Chicago, IL': 'America/Chicago',
      'Dallas, TX': 'America/Chicago',
      'Houston, TX': 'America/Chicago',
      'San Antonio, TX': 'America/Chicago',
      'Austin, TX': 'America/Chicago',
      'Nashville, TN': 'America/Chicago',
      'New York, NY': 'America/New_York',
      'Boston, MA': 'America/New_York',
      'Atlanta, GA': 'America/New_York',
      'Miami, FL': 'America/New_York',
      'Philadelphia, PA': 'America/New_York',
      'Detroit, MI': 'America/New_York',
      'Jacksonville, FL': 'America/New_York',
    };
    return timezoneMap[location] || 'America/New_York';
  }

  private getRandomFreelancerTitle(): string {
    const titles = Object.keys(REALISTIC_SKILL_COMBINATIONS);
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private getRandomExperienceLevel(): ExperienceLevel {
    const levels: ExperienceLevel[] = ['junior', 'mid', 'senior', 'expert'];
    const weights = [0.2, 0.4, 0.3, 0.1]; // Distribution: 20% junior, 40% mid, 30% senior, 10% expert
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < levels.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return levels[i];
      }
    }
    
    return 'mid'; // fallback
  }

  private getExperienceYears(level: ExperienceLevel): number {
    const ranges = {
      junior: [1, 2],
      mid: [3, 5],
      senior: [6, 10],
      expert: [11, 20],
    };
    const [min, max] = ranges[level];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getExperienceLevelFromRate(rate: number): ExperienceLevel {
    if (rate < 40) return 'junior';
    if (rate < 70) return 'mid';
    if (rate < 120) return 'senior';
    return 'expert';
  }

  private getCategoryFromTitle(title: string): string {
    const categoryMap: Record<string, string> = {
      'Full-Stack Developer': 'Web Development',
      'Frontend Developer': 'Web Development',
      'Backend Developer': 'Web Development',
      'Mobile App Developer': 'Mobile Development',
      'UI/UX Designer': 'UI/UX Design',
      'Data Scientist': 'Data Science',
      'DevOps Engineer': 'DevOps',
    };
    return categoryMap[title] || 'Web Development';
  }

  private generateExperienceDescription(years: number, title: string): string {
    return `${years}+ years of professional experience as a ${title.toLowerCase()}. Expert in modern development practices, agile methodologies, and delivering high-quality solutions for clients across various industries.`;
  }

  private getRandomAdminExpertise(): string {
    const expertise = [
      'platform management and user experience',
      'system administration and security',
      'business operations and strategy',
      'customer success and support',
      'product development and innovation',
    ];
    return expertise[Math.floor(Math.random() * expertise.length)];
  }

  private getRandomCompanyType(): string {
    const types = [
      'tech startup', 'enterprise software company', 'digital agency', 'consulting firm',
      'e-commerce business', 'fintech company', 'healthcare technology', 'educational platform',
      'marketing agency', 'design studio', 'SaaS company', 'mobile app company',
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateCompanyDomain(companyType: string): string {
    const prefixes = ['tech', 'digital', 'smart', 'pro', 'elite', 'prime', 'next', 'future'];
    const suffixes = ['corp', 'solutions', 'systems', 'group', 'labs', 'works', 'studio', 'agency'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${suffix}.com`;
  }

  private getRandomEmailDomain(): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com'];
    return domains[Math.floor(Math.random() * domains.length)];
  }

  private getJobTitleVariation(baseTitle: string, index: number): string {
    const variations = {
      'Full-Stack Developer': ['Full-Stack Developer', 'Senior Full-Stack Developer', 'Lead Full-Stack Developer', 'Principal Engineer'],
      'Frontend Developer': ['Frontend Developer', 'Senior Frontend Developer', 'Lead Frontend Developer', 'UI Engineer'],
      'Backend Developer': ['Backend Developer', 'Senior Backend Developer', 'Lead Backend Developer', 'Systems Engineer'],
      'UI/UX Designer': ['UI/UX Designer', 'Senior UI/UX Designer', 'Lead Designer', 'Design Director'],
      'Data Scientist': ['Data Scientist', 'Senior Data Scientist', 'Lead Data Scientist', 'Principal Data Scientist'],
      'DevOps Engineer': ['DevOps Engineer', 'Senior DevOps Engineer', 'Lead DevOps Engineer', 'Infrastructure Architect'],
    };
    
    const titleVariations = variations[baseTitle as keyof typeof variations] || [baseTitle];
    return titleVariations[Math.min(index, titleVariations.length - 1)];
  }

  private getRandomCompanyName(): string {
    const companies = [
      'Tech Innovations Inc.', 'Digital Solutions LLC', 'Future Systems Corp', 'Smart Technologies',
      'Elite Software Group', 'Prime Development', 'Next Generation Labs', 'Advanced Computing',
      'Innovative Designs', 'Creative Studios Pro', 'Modern Web Solutions', 'Cloud First Systems',
      'Data Driven Analytics', 'Secure Networks Inc', 'Mobile First Development', 'AI Solutions Corp',
    ];
    return companies[Math.floor(Math.random() * companies.length)];
  }

  private generateJobDescription(title: string, _years: number): string {
    const templates = [
      `Led development of scalable applications serving ${Math.floor(Math.random() * 900000) + 100000}+ users. Mentored ${Math.floor(Math.random() * 5) + 2} junior developers and established best practices for code quality and performance.`,
      `Built and maintained multiple ${title.toLowerCase()} solutions using modern technologies. Implemented CI/CD pipelines and automated testing, reducing deployment time by ${Math.floor(Math.random() * 50) + 30}%.`,
      `Collaborated with cross-functional teams to deliver high-quality products. Improved system performance by ${Math.floor(Math.random() * 40) + 20}% and reduced technical debt through strategic refactoring.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private getRelevantDegree(title: string, isPrimary: boolean): string {
    const degreeMap: Record<string, string[]> = {
      'Full-Stack Developer': ['Bachelor of Science', 'Bachelor of Computer Science', 'Bachelor of Software Engineering'],
      'Frontend Developer': ['Bachelor of Science', 'Bachelor of Computer Science', 'Bachelor of Web Development'],
      'Backend Developer': ['Bachelor of Science', 'Bachelor of Computer Science', 'Bachelor of Software Engineering'],
      'UI/UX Designer': ['Bachelor of Fine Arts', 'Bachelor of Design', 'Bachelor of Graphic Design'],
      'Data Scientist': ['Bachelor of Science', 'Master of Science', 'Bachelor of Mathematics'],
      'DevOps Engineer': ['Bachelor of Science', 'Bachelor of Computer Science', 'Bachelor of Information Technology'],
    };
    
    const degrees = degreeMap[title] || ['Bachelor of Science'];
    if (!isPrimary && Math.random() > 0.5) {
      return 'Master of Science'; // 50% chance of master's for second degree
    }
    return degrees[Math.floor(Math.random() * degrees.length)];
  }

  private getRandomUniversity(): string {
    const universities = [
      'University of California, Berkeley', 'Stanford University', 'MIT', 'Carnegie Mellon University',
      'University of Washington', 'University of Texas at Austin', 'Georgia Institute of Technology',
      'University of Illinois', 'Purdue University', 'University of Michigan', 'Cornell University',
      'University of Southern California', 'New York University', 'Boston University',
      'Arizona State University', 'University of Florida', 'Virginia Tech', 'Penn State University',
    ];
    return universities[Math.floor(Math.random() * universities.length)];
  }

  private getRelevantFieldOfStudy(title: string): string {
    const fieldMap: Record<string, string[]> = {
      'Full-Stack Developer': ['Computer Science', 'Software Engineering', 'Information Technology'],
      'Frontend Developer': ['Computer Science', 'Web Development', 'Digital Media'],
      'Backend Developer': ['Computer Science', 'Software Engineering', 'Information Systems'],
      'UI/UX Designer': ['Graphic Design', 'Digital Design', 'Human-Computer Interaction'],
      'Data Scientist': ['Computer Science', 'Data Science', 'Statistics', 'Mathematics'],
      'DevOps Engineer': ['Computer Science', 'Information Technology', 'Systems Engineering'],
    };
    
    const fields = fieldMap[title] || ['Computer Science'];
    return fields[Math.floor(Math.random() * fields.length)];
  }

  private generateEducationDescription(title: string): string {
    const templates = [
      `Specialized in ${title.toLowerCase()} with focus on modern development practices and software architecture.`,
      `Graduated with honors. Completed capstone project in ${title.toLowerCase()} that received recognition from faculty.`,
      `Strong foundation in computer science fundamentals with emphasis on practical application in ${title.toLowerCase()}.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}