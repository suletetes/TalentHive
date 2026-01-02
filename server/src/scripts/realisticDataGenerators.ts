// Realistic data generators for comprehensive seed data

// Market data and realistic patterns
export const MARKET_DATA = {
  // Geographic rate multipliers (base rate * multiplier)
  locationMultipliers: {
    'San Francisco, CA': 1.8,
    'New York, NY': 1.7,
    'Seattle, WA': 1.5,
    'Los Angeles, CA': 1.4,
    'Boston, MA': 1.3,
    'Austin, TX': 1.2,
    'Chicago, IL': 1.1,
    'Denver, CO': 1.1,
    'Atlanta, GA': 1.0,
    'Miami, FL': 1.0,
    'Phoenix, AZ': 0.9,
    'Dallas, TX': 0.9,
    'Houston, TX': 0.9,
    'Philadelphia, PA': 0.9,
    'Detroit, MI': 0.8,
    'Nashville, TN': 0.8,
    'Portland, OR': 1.2,
    'San Diego, CA': 1.3,
    'Jacksonville, FL': 0.8,
    'San Antonio, TX': 0.8,
  },

  // Base hourly rates by skill level and category
  baseRates: {
    'Web Development': { junior: 35, mid: 65, senior: 95, expert: 140 },
    'Mobile Development': { junior: 40, mid: 70, senior: 105, expert: 150 },
    'UI/UX Design': { junior: 30, mid: 55, senior: 85, expert: 125 },
    'Graphic Design': { junior: 25, mid: 45, senior: 70, expert: 100 },
    'Data Science': { junior: 45, mid: 80, senior: 120, expert: 180 },
    'DevOps': { junior: 50, mid: 85, senior: 125, expert: 175 },
    'Content Writing': { junior: 20, mid: 35, senior: 55, expert: 80 },
    'Digital Marketing': { junior: 25, mid: 45, senior: 70, expert: 105 },
    'Video & Animation': { junior: 30, mid: 55, senior: 85, expert: 120 },
    'Game Development': { junior: 40, mid: 70, senior: 110, expert: 160 },
    'Blockchain': { junior: 60, mid: 100, senior: 150, expert: 220 },
    'Cybersecurity': { junior: 55, mid: 90, senior: 135, expert: 200 },
  },

  // Project complexity multipliers
  complexityMultipliers: {
    simple: 0.7,
    moderate: 1.0,
    complex: 1.5,
    enterprise: 2.2,
  },

  // Seasonal trends (multiplier by month)
  seasonalTrends: {
    1: 0.8,  // January - slow start
    2: 0.9,  // February
    3: 1.1,  // March - Q1 push
    4: 1.0,  // April
    5: 1.0,  // May
    6: 0.9,  // June - summer slowdown starts
    7: 0.8,  // July - vacation season
    8: 0.8,  // August - vacation season
    9: 1.2,  // September - back to work surge
    10: 1.3, // October - Q4 push
    11: 1.4, // November - holiday prep
    12: 0.7, // December - holiday slowdown
  },
};

// Skill combinations that make sense together
export const REALISTIC_SKILL_COMBINATIONS = {
  'Full-Stack Developer': {
    core: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    database: ['MongoDB', 'PostgreSQL', 'MySQL'],
    cloud: ['AWS', 'Azure', 'Docker'],
    additional: ['GraphQL', 'REST API', 'Redis', 'Kubernetes'],
  },
  'Frontend Developer': {
    core: ['JavaScript', 'TypeScript', 'React', 'HTML/CSS'],
    frameworks: ['Vue.js', 'Angular', 'Next.js'],
    styling: ['Tailwind CSS', 'Sass', 'Styled Components'],
    additional: ['Webpack', 'Vite', 'Testing Library'],
  },
  'Backend Developer': {
    core: ['Node.js', 'Express.js', 'TypeScript'],
    database: ['MongoDB', 'PostgreSQL', 'Redis'],
    cloud: ['AWS', 'Docker', 'Kubernetes'],
    additional: ['GraphQL', 'REST API', 'Microservices'],
  },
  'Mobile App Developer': {
    core: ['React Native', 'Flutter'],
    native: ['Swift', 'Kotlin', 'iOS Development', 'Android Development'],
    backend: ['Firebase', 'REST API'],
    additional: ['Push Notifications', 'App Store Optimization'],
  },
  'UI/UX Designer': {
    core: ['Figma', 'Adobe XD', 'Sketch'],
    skills: ['Prototyping', 'User Research', 'Wireframing'],
    additional: ['Design Systems', 'Usability Testing', 'Information Architecture'],
  },
  'Data Scientist': {
    core: ['Python', 'R', 'SQL'],
    ml: ['Machine Learning', 'TensorFlow', 'PyTorch'],
    analysis: ['Pandas', 'NumPy', 'Data Analysis'],
    viz: ['Tableau', 'Power BI', 'Data Visualization'],
  },
  'DevOps Engineer': {
    core: ['Docker', 'Kubernetes', 'Jenkins'],
    cloud: ['AWS', 'Azure', 'Terraform'],
    additional: ['CI/CD', 'Monitoring', 'Infrastructure as Code'],
  },
};

// Industry-specific project types
export const INDUSTRY_PROJECT_TYPES = {
  fintech: [
    'Payment Gateway Integration',
    'Trading Platform Development',
    'Cryptocurrency Wallet App',
    'Financial Dashboard',
    'KYC/AML Compliance System',
    'Robo-Advisor Platform',
  ],
  healthcare: [
    'Telemedicine Platform',
    'Patient Management System',
    'Medical Records Portal',
    'Health Tracking App',
    'Appointment Scheduling System',
    'HIPAA Compliant Database',
  ],
  ecommerce: [
    'Multi-vendor Marketplace',
    'Inventory Management System',
    'Shopping Cart Integration',
    'Product Recommendation Engine',
    'Order Fulfillment System',
    'Customer Analytics Dashboard',
  ],
  education: [
    'Learning Management System',
    'Online Course Platform',
    'Student Information System',
    'Virtual Classroom Tool',
    'Assessment and Grading System',
    'Educational Game Development',
  ],
  saas: [
    'Multi-tenant Architecture',
    'Subscription Management System',
    'API Gateway Development',
    'Analytics Dashboard',
    'User Onboarding Flow',
    'Integration Platform',
  ],
};

/**
 * Generate realistic hourly rate based on multiple factors
 */
export function generateRealisticHourlyRate(
  category: string,
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert',
  location: string,
  specializations: string[] = []
): number {
  const baseRate = MARKET_DATA.baseRates[category]?.[experienceLevel] || 50;
  const locationMultiplier = MARKET_DATA.locationMultipliers[location] || 1.0;
  
  // Specialization bonus
  let specializationBonus = 1.0;
  const highValueSkills = ['Blockchain', 'Machine Learning', 'Cybersecurity', 'DevOps'];
  if (specializations.some(skill => highValueSkills.includes(skill))) {
    specializationBonus = 1.2;
  }
  
  // Add some realistic variance (±15%)
  const variance = 0.85 + Math.random() * 0.3;
  
  const finalRate = Math.round(baseRate * locationMultiplier * specializationBonus * variance);
  return Math.max(15, finalRate); // Minimum $15/hour
}

/**
 * Generate realistic project budget based on complexity and requirements
 */
export function calculateRealisticBudget(
  projectType: string,
  skillsRequired: string[],
  estimatedHours: number,
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise' = 'moderate'
): { min: number; max: number; type: 'fixed' | 'hourly' } {
  // Determine if project should be fixed or hourly
  const isFixedPrice = estimatedHours < 100 && complexity !== 'enterprise';
  
  if (isFixedPrice) {
    // Fixed price calculation
    const basePrice = estimatedHours * 65; // Average rate
    const complexityMultiplier = MARKET_DATA.complexityMultipliers[complexity];
    const skillMultiplier = skillsRequired.length > 5 ? 1.2 : 1.0;
    
    const baseTotal = basePrice * complexityMultiplier * skillMultiplier;
    const min = Math.round(baseTotal * 0.8);
    const max = Math.round(baseTotal * 1.3);
    
    return { min, max, type: 'fixed' };
  } else {
    // Hourly rate range
    const avgRate = 65;
    const min = Math.round(avgRate * 0.7);
    const max = Math.round(avgRate * 1.5);
    
    return { min, max, type: 'hourly' };
  }
}

/**
 * Generate realistic skill set for a freelancer
 */
export function generateRealisticSkillSet(
  title: string,
  experienceYears: number
): string[] {
  const skillCombination = REALISTIC_SKILL_COMBINATIONS[title] || REALISTIC_SKILL_COMBINATIONS['Full-Stack Developer'];
  
  const skills: string[] = [];
  
  // Always include core skills
  skills.push(...skillCombination.core);
  
  // Add skills based on experience level
  const skillCategories = Object.keys(skillCombination).filter(key => key !== 'core');
  
  if (experienceYears >= 2) {
    // Mid-level: add 1-2 categories
    const categoriesToAdd = skillCategories.slice(0, Math.min(2, skillCategories.length));
    categoriesToAdd.forEach(category => {
      const categorySkills = skillCombination[category] || [];
      skills.push(...categorySkills.slice(0, 2));
    });
  }
  
  if (experienceYears >= 5) {
    // Senior: add more skills from remaining categories
    const remainingCategories = skillCategories.slice(2);
    remainingCategories.forEach(category => {
      const categorySkills = skillCombination[category] || [];
      skills.push(...categorySkills.slice(0, 1));
    });
  }
  
  // Remove duplicates and limit total skills
  const uniqueSkills = [...new Set(skills)];
  const maxSkills = Math.min(12, 4 + Math.floor(experienceYears / 2));
  
  return uniqueSkills.slice(0, maxSkills);
}

/**
 * Generate realistic portfolio with metrics
 */
export function generatePortfolioWithMetrics(
  skills: string[],
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert'
): any[] {
  const portfolioCount = {
    junior: 2,
    mid: 4,
    senior: 6,
    expert: 8,
  }[experienceLevel];

  const portfolio = [];
  
  for (let i = 0; i < portfolioCount; i++) {
    const projectAge = Math.floor(Math.random() * 365 * 3); // Up to 3 years old
    const completedAt = new Date(Date.now() - projectAge * 24 * 60 * 60 * 1000);
    
    // Select relevant skills for this project
    const projectSkills = skills
      .sort(() => 0.5 - Math.random())
      .slice(0, 3 + Math.floor(Math.random() * 3));
    
    const projectTypes = [
      'E-commerce Platform',
      'Mobile Application',
      'Dashboard Analytics',
      'API Development',
      'Website Redesign',
      'Database Optimization',
      'Cloud Migration',
      'Security Audit',
    ];
    
    const metrics = {
      performanceImprovement: Math.floor(Math.random() * 50) + 20, // 20-70%
      userEngagement: Math.floor(Math.random() * 40) + 30, // 30-70%
      loadTimeReduction: Math.floor(Math.random() * 60) + 20, // 20-80%
      bugReduction: Math.floor(Math.random() * 70) + 30, // 30-100%
    };
    
    portfolio.push({
      title: projectTypes[Math.floor(Math.random() * projectTypes.length)],
      description: `Successfully delivered ${projectTypes[i % projectTypes.length].toLowerCase()} with ${metrics.performanceImprovement}% performance improvement and ${metrics.userEngagement}% increase in user engagement.`,
      technologies: projectSkills,
      completedAt,
      metrics,
      clientFeedback: generateClientTestimonial(),
      images: [], // Would be populated with actual images in real scenario
    });
  }
  
  return portfolio;
}

/**
 * Generate client testimonials
 */
export function generateClientTestimonial(): string {
  const testimonials = [
    "Exceptional work quality and attention to detail. Delivered ahead of schedule.",
    "Outstanding communication throughout the project. Highly recommended!",
    "Exceeded our expectations in every way. Will definitely work together again.",
    "Professional, reliable, and skilled. Perfect execution of our requirements.",
    "Incredible problem-solving skills and creative solutions. Top-tier developer!",
    "Delivered exactly what we needed with excellent code quality and documentation.",
    "Great collaboration and proactive communication. Made the project seamless.",
    "Impressive technical skills and ability to understand complex requirements.",
  ];
  
  return testimonials[Math.floor(Math.random() * testimonials.length)];
}

/**
 * Generate relevant certifications based on skills
 */
export function generateRelevantCertifications(skills: string[]): any[] {
  const certificationMap = {
    'AWS': ['AWS Certified Solutions Architect', 'AWS Certified Developer'],
    'Azure': ['Microsoft Azure Fundamentals', 'Azure Developer Associate'],
    'React': ['Meta React Developer Certificate'],
    'Google Analytics': ['Google Analytics Certified'],
    'Python': ['Python Institute PCAP Certification'],
    'Machine Learning': ['Google ML Engineer Certificate', 'Coursera ML Specialization'],
    'Cybersecurity': ['CompTIA Security+', 'Certified Ethical Hacker'],
    'Docker': ['Docker Certified Associate'],
    'Kubernetes': ['Certified Kubernetes Administrator'],
  };
  
  const certifications = [];
  
  skills.forEach(skill => {
    if (certificationMap[skill] && Math.random() > 0.7) { // 30% chance
      const skillCerts = certificationMap[skill];
      const cert = skillCerts[Math.floor(Math.random() * skillCerts.length)];
      const dateEarned = new Date(Date.now() - Math.random() * 365 * 2 * 24 * 60 * 60 * 1000);
      
      certifications.push({
        name: cert,
        issuer: getIssuerForCertification(cert),
        dateEarned,
        credentialId: generateCredentialId(),
      });
    }
  });
  
  return certifications;
}

function getIssuerForCertification(certName: string): string {
  if (certName.includes('AWS')) return 'Amazon Web Services';
  if (certName.includes('Azure') || certName.includes('Microsoft')) return 'Microsoft';
  if (certName.includes('Google')) return 'Google';
  if (certName.includes('Meta')) return 'Meta';
  if (certName.includes('CompTIA')) return 'CompTIA';
  if (certName.includes('Docker')) return 'Docker Inc.';
  if (certName.includes('Kubernetes')) return 'Cloud Native Computing Foundation';
  return 'Professional Certification Body';
}

function generateCredentialId(): string {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

/**
 * Generate realistic availability calendar
 */
export function generateRealisticAvailability(): any {
  const now = new Date();
  const timezones = [
    'America/New_York',
    'America/Los_Angeles', 
    'America/Chicago',
    'America/Denver',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];
  
  const availability = {
    hoursPerWeek: 20 + Math.floor(Math.random() * 20), // 20-40 hours
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
    workingHours: {
      start: '09:00',
      end: '17:00',
    },
    unavailableDates: [],
    preferredWorkDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  };
  
  // Add some unavailable dates (vacations, etc.)
  for (let i = 0; i < 3; i++) {
    const futureDate = new Date(now.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000);
    availability.unavailableDates.push({
      start: futureDate,
      end: new Date(futureDate.getTime() + (3 + Math.floor(Math.random() * 7)) * 24 * 60 * 60 * 1000),
      reason: ['Vacation', 'Conference', 'Personal'][Math.floor(Math.random() * 3)],
    });
  }
  
  return availability;
}

/**
 * Generate seasonal project trends
 */
export function generateSeasonalTrends(): any[] {
  const trends = [];
  const currentMonth = new Date().getMonth() + 1;
  
  for (let month = 1; month <= 12; month++) {
    const multiplier = MARKET_DATA.seasonalTrends[month];
    const baseProjects = 100;
    const projectCount = Math.round(baseProjects * multiplier);
    
    trends.push({
      month,
      projectCount,
      averageBudget: 3000 * multiplier,
      topCategories: getTopCategoriesForMonth(month),
    });
  }
  
  return trends;
}

function getTopCategoriesForMonth(month: number): string[] {
  const seasonalCategories = {
    1: ['Web Development', 'Mobile Development'], // New Year projects
    2: ['Content Writing', 'Digital Marketing'], // Valentine's/marketing prep
    3: ['Web Development', 'UI/UX Design'], // Q1 push
    4: ['Mobile Development', 'Data Science'], // Spring projects
    5: ['Web Development', 'DevOps'], // Pre-summer launch
    6: ['Content Writing', 'Video & Animation'], // Summer content
    7: ['Mobile Development', 'Game Development'], // Summer apps
    8: ['UI/UX Design', 'Graphic Design'], // Back-to-school prep
    9: ['Web Development', 'Data Science'], // Back-to-work surge
    10: ['E-commerce', 'Digital Marketing'], // Holiday prep
    11: ['E-commerce', 'Web Development'], // Black Friday prep
    12: ['Content Writing', 'Graphic Design'], // Holiday content
  };
  
  return seasonalCategories[month] || ['Web Development', 'Mobile Development'];
}

/**
 * Generate realistic conversation flows
 */
export function generateConversationFlow(
  type: 'project_negotiation' | 'milestone_review' | 'scope_change' | 'urgent_fix' | 'completion'
): any[] {
  const flows = {
    project_negotiation: [
      { sender: 'client', message: "Hi! I reviewed your proposal for the project. Can we discuss the timeline and some technical details?" },
      { sender: 'freelancer', message: "Absolutely! I'd be happy to discuss. What specific aspects would you like to clarify?" },
      { sender: 'client', message: "The timeline seems tight for the features we need. Would it be possible to extend by a week?" },
      { sender: 'freelancer', message: "I can accommodate that. With the extra week, I can also add some additional testing and optimization. Would that work?" },
      { sender: 'client', message: "Perfect! That sounds great. Let's move forward with the updated timeline." },
    ],
    milestone_review: [
      { sender: 'freelancer', message: "Hi! I've completed the first milestone - the user authentication system. Please review when you have a chance." },
      { sender: 'client', message: "Thanks! I'll review it today and get back to you with feedback." },
      { sender: 'client', message: "Looks great overall! Just a few minor adjustments needed on the password reset flow. Can you update that?" },
      { sender: 'freelancer', message: "Sure thing! I'll make those adjustments and have it ready by tomorrow." },
      { sender: 'freelancer', message: "Updates are complete! The password reset flow now matches your requirements exactly." },
    ],
    scope_change: [
      { sender: 'client', message: "Hi! We've had some new requirements come up. Would it be possible to add a reporting dashboard?" },
      { sender: 'freelancer', message: "I can definitely add that. It would require about 15-20 additional hours. Would you like me to prepare a change request?" },
      { sender: 'client', message: "Yes, please send over the details and updated timeline." },
      { sender: 'freelancer', message: "I've prepared the change request. The dashboard will add $1,200 and extend the timeline by 1 week. Does that work?" },
      { sender: 'client', message: "Approved! Please proceed with the additional work." },
    ],
    urgent_fix: [
      { sender: 'client', message: "Hi! We have an urgent issue - users can't log in. Can you take a look ASAP?" },
      { sender: 'freelancer', message: "I'm on it! Let me investigate immediately. Can you provide any error messages users are seeing?" },
      { sender: 'client', message: "They're getting 'Invalid credentials' even with correct passwords. Started about an hour ago." },
      { sender: 'freelancer', message: "Found the issue - database connection timeout. Fixing now. Should be resolved in 10 minutes." },
      { sender: 'freelancer', message: "Fixed! Login is working normally again. I've also added monitoring to prevent this in the future." },
    ],
    completion: [
      { sender: 'freelancer', message: "Great news! The project is complete and ready for final review. All features are implemented and tested." },
      { sender: 'client', message: "Excellent! I'll do a thorough review today. The work looks fantastic so far." },
      { sender: 'client', message: "Everything looks perfect! The quality exceeded our expectations. Thank you for the excellent work!" },
      { sender: 'freelancer', message: "Thank you! It was a pleasure working on this project. I'm available for any future updates or maintenance." },
      { sender: 'client', message: "Definitely! We'll keep you in mind for future projects. I'll leave a review shortly." },
    ],
  };
  
  return flows[type] || flows.project_negotiation;
}

/**
 * Generate performance metrics for analytics
 */
export function generatePerformanceMetrics(userType: 'freelancer' | 'client', userData: any): any {
  if (userType === 'freelancer') {
    return {
      responseTime: {
        average: 2 + Math.random() * 6, // 2-8 hours
        trend: Math.random() > 0.5 ? 'improving' : 'stable',
      },
      projectSuccessRate: 85 + Math.random() * 15, // 85-100%
      clientRetentionRate: 60 + Math.random() * 30, // 60-90%
      earningsGrowth: {
        monthly: -10 + Math.random() * 30, // -10% to +20%
        quarterly: 5 + Math.random() * 25, // 5-30%
      },
      skillDemand: generateSkillDemandMetrics(userData.skills || []),
    };
  } else {
    return {
      projectPostingFrequency: Math.floor(Math.random() * 5) + 1, // 1-5 per month
      budgetUtilization: 70 + Math.random() * 25, // 70-95%
      freelancerRehireRate: 40 + Math.random() * 40, // 40-80%
      averageProjectDuration: 15 + Math.random() * 30, // 15-45 days
      satisfactionScore: 4.2 + Math.random() * 0.8, // 4.2-5.0
    };
  }
}

function generateSkillDemandMetrics(skills: string[]): any {
  const demandLevels = ['Low', 'Medium', 'High', 'Very High'];
  const metrics = {};
  
  skills.forEach(skill => {
    metrics[skill] = {
      demand: demandLevels[Math.floor(Math.random() * demandLevels.length)],
      growth: -5 + Math.random() * 20, // -5% to +15%
      averageRate: 40 + Math.random() * 60, // $40-100/hour
    };
  });
  
  return metrics;
}

/**
 * Generate realistic payment scenarios
 */
export function generatePaymentScenarios(): any[] {
  return [
    {
      type: 'milestone_completed_awaiting_release',
      description: 'Milestone completed, payment held in escrow awaiting client approval',
      probability: 0.3,
      averageHoldTime: 3, // days
    },
    {
      type: 'payment_disputed_in_escrow',
      description: 'Payment disputed, requires platform mediation',
      probability: 0.05,
      averageResolutionTime: 7, // days
    },
    {
      type: 'auto_release_after_7_days',
      description: 'Payment automatically released after escrow period',
      probability: 0.4,
      averageHoldTime: 7, // days
    },
    {
      type: 'partial_payment_with_revisions',
      description: 'Partial payment released, remainder pending revisions',
      probability: 0.15,
      averageHoldTime: 5, // days
    },
    {
      type: 'bonus_payment_for_early_delivery',
      description: 'Additional bonus payment for exceptional work or early delivery',
      probability: 0.1,
      averageHoldTime: 1, // days
    },
  ];
}

/**
 * Generate industry-specific project
 */
export function generateIndustryProject(industry: keyof typeof INDUSTRY_PROJECT_TYPES): any {
  const projectTypes = INDUSTRY_PROJECT_TYPES[industry];
  const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
  
  const industryDescriptions = {
    fintech: "We're a growing fintech company looking to enhance our platform with cutting-edge features. Security and compliance are top priorities.",
    healthcare: "Healthcare technology company seeking to improve patient outcomes through innovative digital solutions. HIPAA compliance required.",
    ecommerce: "E-commerce business looking to scale our platform and improve customer experience. High traffic and performance optimization needed.",
    education: "Educational technology company focused on creating engaging learning experiences for students and educators.",
    saas: "SaaS company building tools that help businesses streamline their operations and increase productivity.",
  };
  
  return {
    title: projectType,
    description: industryDescriptions[industry],
    industry,
    specialRequirements: getIndustryRequirements(industry),
  };
}

function getIndustryRequirements(industry: string): string[] {
  const requirements = {
    fintech: ['PCI DSS Compliance', 'Bank-level Security', 'Real-time Processing', 'Audit Trails'],
    healthcare: ['HIPAA Compliance', 'Data Encryption', 'Patient Privacy', 'FDA Regulations'],
    ecommerce: ['High Availability', 'Payment Processing', 'Inventory Management', 'Mobile Responsive'],
    education: ['FERPA Compliance', 'Accessibility Standards', 'Multi-device Support', 'Progress Tracking'],
    saas: ['Multi-tenancy', 'API Integration', 'Scalability', 'Analytics Dashboard'],
  };
  
  return requirements[industry] || ['High Quality', 'Scalable', 'Secure', 'Well Documented'];
}

/**
 * Generate temporal patterns for realistic data distribution
 */
export function generateTemporalPatterns(): any {
  const now = new Date();
  
  return {
    projectPostings: generateProjectPostingPattern(now),
    freelancerAvailability: generateAvailabilityPattern(now),
    paymentCycles: generatePaymentCyclePattern(now),
    reviewSubmissions: generateReviewSubmissionPattern(now),
  };
}

function generateProjectPostingPattern(baseDate: Date): any[] {
  const patterns = [];
  
  // Generate patterns for last 12 months
  for (let i = 11; i >= 0; i--) {
    const month = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const seasonalMultiplier = MARKET_DATA.seasonalTrends[month.getMonth() + 1];
    const baseCount = 50;
    
    patterns.push({
      month: month.toISOString().substr(0, 7), // YYYY-MM format
      projectCount: Math.round(baseCount * seasonalMultiplier),
      averageBudget: 3000 * seasonalMultiplier,
      peakDays: [1, 15], // Beginning and middle of month
    });
  }
  
  return patterns;
}

function generateAvailabilityPattern(baseDate: Date): any[] {
  const patterns = [];
  const holidays = [
    '2024-01-01', '2024-07-04', '2024-11-28', '2024-12-25', // US holidays
    '2024-05-27', '2024-09-02', '2024-10-14', // Memorial Day, Labor Day, Columbus Day
  ];
  
  // Generate availability for next 90 days
  for (let i = 0; i < 90; i++) {
    const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().substr(0, 10);
    const isHoliday = holidays.includes(dateStr);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    let availabilityMultiplier = 1.0;
    if (isHoliday) availabilityMultiplier = 0.3;
    else if (isWeekend) availabilityMultiplier = 0.6;
    
    patterns.push({
      date: dateStr,
      availabilityMultiplier,
      isHoliday,
      isWeekend,
    });
  }
  
  return patterns;
}

function generatePaymentCyclePattern(baseDate: Date): any[] {
  const patterns = [];
  
  // Most payments happen at month end and mid-month
  for (let i = 0; i < 12; i++) {
    const month = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    
    patterns.push({
      month: month.toISOString().substr(0, 7),
      peakDays: [15, 30], // Mid-month and end-of-month
      averageProcessingTime: 2.5, // days
      volumeMultiplier: i === 0 ? 1.2 : 1.0, // Current month higher
    });
  }
  
  return patterns;
}

function generateReviewSubmissionPattern(baseDate: Date): any[] {
  const patterns = [];
  
  // Reviews typically submitted 3-14 days after project completion
  for (let delay = 1; delay <= 30; delay++) {
    let probability = 0;
    
    if (delay <= 3) probability = 0.4; // 40% within 3 days
    else if (delay <= 7) probability = 0.3; // 30% within a week
    else if (delay <= 14) probability = 0.2; // 20% within 2 weeks
    else probability = 0.1; // 10% after 2 weeks
    
    patterns.push({
      daysAfterCompletion: delay,
      submissionProbability: probability,
    });
  }
  
  return patterns;
}

export default {
  MARKET_DATA,
  REALISTIC_SKILL_COMBINATIONS,
  INDUSTRY_PROJECT_TYPES,
  generateRealisticHourlyRate,
  calculateRealisticBudget,
  generateRealisticSkillSet,
  generatePortfolioWithMetrics,
  generateClientTestimonial,
  generateRelevantCertifications,
  generateRealisticAvailability,
  generateSeasonalTrends,
  generateConversationFlow,
  generatePerformanceMetrics,
  generatePaymentScenarios,
  generateIndustryProject,
  generateTemporalPatterns,
};