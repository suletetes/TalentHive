import bcrypt from 'bcryptjs';

/**
 * Generate 30+ complete freelancer profiles with 100% data filled
 * Includes: skills, education, work experience, portfolio, certifications, languages
 */
export async function generateCompleteFreelancerProfiles() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const freelancers = [
    {
      email: 'alice.fullstack@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'Alice',
        lastName: 'Chen',
        bio: 'Senior Full-Stack Developer with 6+ years building scalable web applications. Expert in React, Node.js, and cloud infrastructure. Delivered 50+ projects with 98% client satisfaction.',
        location: 'San Francisco, CA',
        timezone: 'America/Los_Angeles',
        website: 'https://alicechen.dev',
      },
      freelancerProfile: {
        title: 'Senior Full-Stack Developer',
        hourlyRate: 85,
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL', 'Redis', 'CI/CD', 'Next.js', 'Express.js'],
        experience: '6+ years of professional software development. Previously at Google and Stripe. Specialized in building high-performance web applications.',
        availability: { status: 'available' },
        workExperience: [
          {
            title: 'Senior Software Engineer',
            company: 'Google',
            location: 'Mountain View, CA',
            startDate: new Date('2019-01-01'),
            endDate: new Date('2022-06-01'),
            current: false,
            description: 'Led development of payment processing systems handling $1B+ in transactions. Mentored 5 junior engineers.',
          },
          {
            title: 'Full-Stack Developer',
            company: 'Stripe',
            location: 'San Francisco, CA',
            startDate: new Date('2017-06-01'),
            endDate: new Date('2019-01-01'),
            current: false,
            description: 'Built APIs and dashboards for merchant platform. Improved performance by 40%.',
          },
          {
            title: 'Junior Developer',
            company: 'StartupXYZ',
            location: 'San Francisco, CA',
            startDate: new Date('2016-01-01'),
            endDate: new Date('2017-06-01'),
            current: false,
            description: 'Full-stack development on early-stage SaaS product.',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Science',
            institution: 'UC Berkeley',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2012-09-01'),
            endDate: new Date('2016-05-01'),
            description: 'GPA: 3.8/4.0. Dean\'s List all semesters.',
          },
          {
            degree: 'Master of Science',
            institution: 'Stanford University',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2016-09-01'),
            endDate: new Date('2018-05-01'),
            description: 'Specialized in distributed systems and cloud computing.',
          },
        ],
        certifications: [
          {
            name: 'AWS Certified Solutions Architect - Professional',
            issuer: 'Amazon Web Services',
            dateEarned: new Date('2021-03-15'),
            verificationUrl: 'https://aws.amazon.com/certification',
          },
          {
            name: 'Kubernetes Application Developer',
            issuer: 'Linux Foundation',
            dateEarned: new Date('2020-11-20'),
            verificationUrl: 'https://www.cncf.io/certification',
          },
        ],
        languages: [
          { language: 'English', proficiency: 'native' },
          { language: 'Mandarin', proficiency: 'fluent' },
          { language: 'Spanish', proficiency: 'conversational' },
        ],
        portfolio: [
          {
            title: 'E-Commerce Platform',
            description: 'Full-featured e-commerce platform with real-time inventory, payment processing, and analytics. Handles 50k+ daily transactions.',
            images: [],
            technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS', 'Redis'],
            projectUrl: 'https://ecommerce-demo.example.com',
            completedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Real-time Analytics Dashboard',
            description: 'Real-time analytics dashboard for SaaS platform. Processes 1M+ events daily with sub-second latency.',
            images: [],
            technologies: ['React', 'Node.js', 'WebSocket', 'D3.js', 'PostgreSQL', 'Redis'],
            projectUrl: 'https://analytics-demo.example.com',
            completedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Microservices Architecture',
            description: 'Designed and implemented microservices architecture for enterprise application. Reduced deployment time by 60%.',
            images: [],
            technologies: ['Node.js', 'Docker', 'Kubernetes', 'AWS', 'GraphQL'],
            projectUrl: 'https://github.com/alicechen/microservices',
            completedAt: new Date(Date.now() - 270 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      rating: { average: 4.9, count: 28 },
    },
    {
      email: 'bob.designer@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'Bob',
        lastName: 'Martinez',
        bio: 'Award-winning UI/UX Designer with 8+ years creating beautiful digital experiences. Specialized in mobile apps, web design, and design systems. Featured in Awwwards.',
        location: 'Los Angeles, CA',
        timezone: 'America/Los_Angeles',
        website: 'https://bobmartinez.design',
      },
      freelancerProfile: {
        title: 'Senior UI/UX Designer',
        hourlyRate: 75,
        skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems', 'Mobile Design', 'Web Design', 'Usability Testing', 'Interaction Design', 'Visual Design'],
        experience: '8+ years designing digital products for startups and Fortune 500 companies. Expert in user-centered design and design systems.',
        availability: { status: 'available' },
        workExperience: [
          {
            title: 'Design Director',
            company: 'Apple',
            location: 'Cupertino, CA',
            startDate: new Date('2019-06-01'),
            endDate: new Date('2023-01-01'),
            current: false,
            description: 'Led design team for iOS app redesign. Increased user engagement by 45%.',
          },
          {
            title: 'Senior Product Designer',
            company: 'Airbnb',
            location: 'San Francisco, CA',
            startDate: new Date('2017-03-01'),
            endDate: new Date('2019-06-01'),
            current: false,
            description: 'Designed mobile and web experiences for 100M+ users.',
          },
          {
            title: 'UX Designer',
            company: 'Uber',
            location: 'San Francisco, CA',
            startDate: new Date('2015-09-01'),
            endDate: new Date('2017-03-01'),
            current: false,
            description: 'Worked on driver and rider app interfaces.',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Fine Arts',
            institution: 'Rhode Island School of Design',
            fieldOfStudy: 'Graphic Design',
            startDate: new Date('2011-09-01'),
            endDate: new Date('2015-05-01'),
            description: 'Graduated with honors. Focused on digital design and interaction design.',
          },
        ],
        certifications: [
          {
            name: 'Google UX Design Certificate',
            issuer: 'Google',
            dateEarned: new Date('2020-06-15'),
            verificationUrl: 'https://www.coursera.org/professional-certificates/google-ux-design',
          },
          {
            name: 'Interaction Design Specialist',
            issuer: 'Interaction Design Foundation',
            dateEarned: new Date('2019-12-10'),
            verificationUrl: 'https://www.interaction-design.org',
          },
        ],
        languages: [
          { language: 'English', proficiency: 'native' },
          { language: 'Spanish', proficiency: 'fluent' },
        ],
        portfolio: [
          {
            title: 'Mobile Banking App Redesign',
            description: 'Complete redesign of mobile banking app. Increased user engagement by 45% and reduced support tickets by 30%.',
            images: [],
            technologies: ['Figma', 'Prototyping', 'User Testing'],
            projectUrl: 'https://banking-app-demo.example.com',
            completedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'SaaS Dashboard Design System',
            description: 'Created comprehensive design system and component library for B2B SaaS platform serving 50k+ users.',
            images: [],
            technologies: ['Figma', 'Design System', 'Component Library'],
            projectUrl: 'https://saas-dashboard-demo.example.com',
            completedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'E-Learning Platform UI',
            description: 'Designed user interface for online learning platform. Improved course completion rate by 35%.',
            images: [],
            technologies: ['Figma', 'Adobe XD', 'Prototyping'],
            projectUrl: 'https://elearning-demo.example.com',
            completedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      rating: { average: 4.95, count: 35 },
    },
    {
      email: 'carol.writer@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'Carol',
        lastName: 'Thompson',
        bio: 'Technical writer and content strategist with 7+ years experience. Specialized in API documentation, user guides, and technical blogs. Published in TechCrunch and Medium.',
        location: 'Seattle, WA',
        timezone: 'America/Los_Angeles',
        website: 'https://carolthompson.com',
      },
      freelancerProfile: {
        title: 'Senior Technical Writer',
        hourlyRate: 65,
        skills: ['Technical Writing', 'Content Strategy', 'API Documentation', 'User Guides', 'SEO Writing', 'Markdown', 'Git', 'Confluence', 'Jira', 'Adobe Suite', 'Copywriting', 'Editing'],
        experience: '7+ years writing technical documentation for SaaS companies and open-source projects.',
        availability: { status: 'available' },
        workExperience: [
          {
            title: 'Senior Technical Writer',
            company: 'Twilio',
            location: 'San Francisco, CA',
            startDate: new Date('2019-02-01'),
            endDate: new Date('2023-03-01'),
            current: false,
            description: 'Led documentation team for communications API. Improved developer onboarding time by 50%.',
          },
          {
            title: 'Technical Writer',
            company: 'GitHub',
            location: 'San Francisco, CA',
            startDate: new Date('2017-06-01'),
            endDate: new Date('2019-02-01'),
            current: false,
            description: 'Wrote documentation for GitHub Actions and API.',
          },
          {
            title: 'Content Writer',
            company: 'Medium',
            location: 'San Francisco, CA',
            startDate: new Date('2016-01-01'),
            endDate: new Date('2017-06-01'),
            current: false,
            description: 'Created technical content and tutorials.',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Arts',
            institution: 'University of Washington',
            fieldOfStudy: 'English & Technical Communication',
            startDate: new Date('2012-09-01'),
            endDate: new Date('2016-05-01'),
            description: 'Graduated summa cum laude.',
          },
        ],
        certifications: [
          {
            name: 'Technical Writing Certificate',
            issuer: 'Society for Technical Communication',
            dateEarned: new Date('2017-06-15'),
            verificationUrl: 'https://www.stc.org',
          },
        ],
        languages: [
          { language: 'English', proficiency: 'native' },
          { language: 'French', proficiency: 'conversational' },
        ],
        portfolio: [
          {
            title: 'API Documentation Suite',
            description: 'Comprehensive API documentation for payment processing platform. Reduced support tickets by 40%.',
            images: [],
            technologies: ['Markdown', 'Swagger', 'Git'],
            projectUrl: 'https://api-docs-demo.example.com',
            completedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'User Guide & Tutorials',
            description: 'Created user guides and video tutorials for SaaS platform. Improved user adoption by 60%.',
            images: [],
            technologies: ['Markdown', 'Confluence', 'Loom'],
            projectUrl: 'https://user-guide-demo.example.com',
            completedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      rating: { average: 4.8, count: 22 },
    },
    {
      email: 'david.mobile@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'David',
        lastName: 'Kumar',
        bio: 'Mobile app developer with 5+ years building iOS and Android apps. Expert in React Native and Flutter. 20+ apps published on App Store and Google Play.',
        location: 'Austin, TX',
        timezone: 'America/Chicago',
        website: 'https://davidkumar.dev',
      },
      freelancerProfile: {
        title: 'Mobile App Developer',
        hourlyRate: 80,
        skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase', 'iOS Development', 'Android Development', 'Redux', 'GraphQL', 'REST API', 'App Store', 'Google Play'],
        experience: '5+ years developing mobile applications for startups and enterprises.',
        availability: { status: 'available' },
        workExperience: [
          {
            title: 'Senior Mobile Developer',
            company: 'Uber',
            location: 'San Francisco, CA',
            startDate: new Date('2019-03-01'),
            endDate: new Date('2023-02-01'),
            current: false,
            description: 'Led mobile app development for driver platform. 10M+ downloads.',
          },
          {
            title: 'Mobile Developer',
            company: 'Lyft',
            location: 'San Francisco, CA',
            startDate: new Date('2017-07-01'),
            endDate: new Date('2019-03-01'),
            current: false,
            description: 'Developed iOS and Android apps.',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Technology',
            institution: 'Indian Institute of Technology',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2013-08-01'),
            endDate: new Date('2017-05-01'),
            description: 'Top 1% of class.',
          },
        ],
        certifications: [
          {
            name: 'React Native Developer Certification',
            issuer: 'React Native Academy',
            dateEarned: new Date('2020-09-20'),
            verificationUrl: 'https://reactnativeacademy.io',
          },
        ],
        languages: [
          { language: 'English', proficiency: 'fluent' },
          { language: 'Hindi', proficiency: 'native' },
        ],
        portfolio: [
          {
            title: 'Fitness Tracking App',
            description: 'Cross-platform fitness app built with React Native. 100k+ downloads, 4.8 star rating.',
            images: [],
            technologies: ['React Native', 'Firebase', 'Redux'],
            projectUrl: 'https://fitness-app-demo.example.com',
            completedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Social Networking App',
            description: 'Real-time social networking app with messaging and notifications.',
            images: [],
            technologies: ['React Native', 'Firebase', 'GraphQL'],
            projectUrl: 'https://social-app-demo.example.com',
            completedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      rating: { average: 4.85, count: 18 },
    },
    {
      email: 'emma.marketing@example.com',
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: true,
      profile: {
        firstName: 'Emma',
        lastName: 'Wilson',
        bio: 'Digital marketing specialist with 6+ years experience. Expertise in SEO, SEM, and social media marketing. Helped 50+ businesses grow revenue by 200%+.',
        location: 'New York, NY',
        timezone: 'America/New_York',
        website: 'https://emmawilson.marketing',
      },
      freelancerProfile: {
        title: 'Digital Marketing Specialist',
        hourlyRate: 70,
        skills: ['SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Social Media Marketing', 'Email Marketing', 'Content Marketing', 'Analytics', 'Google Analytics', 'Conversion Optimization', 'A/B Testing', 'Marketing Automation'],
        experience: '6+ years helping businesses grow through digital marketing.',
        availability: { status: 'available' },
        workExperience: [
          {
            title: 'Marketing Manager',
            company: 'HubSpot',
            location: 'Cambridge, MA',
            startDate: new Date('2019-01-01'),
            endDate: new Date('2023-01-01'),
            current: false,
            description: 'Managed marketing campaigns for enterprise clients.',
          },
          {
            title: 'Digital Marketer',
            company: 'Shopify',
            location: 'Toronto, Canada',
            startDate: new Date('2017-06-01'),
            endDate: new Date('2019-01-01'),
            current: false,
            description: 'Grew merchant base by 150%.',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Business Administration',
            institution: 'New York University',
            fieldOfStudy: 'Marketing',
            startDate: new Date('2013-09-01'),
            endDate: new Date('2017-05-01'),
            description: 'Graduated with distinction.',
          },
        ],
        certifications: [
          {
            name: 'Google Ads Certification',
            issuer: 'Google',
            dateEarned: new Date('2021-03-15'),
            verificationUrl: 'https://google.com/ads/certification',
          },
          {
            name: 'HubSpot Inbound Marketing Certification',
            issuer: 'HubSpot',
            dateEarned: new Date('2020-07-20'),
            verificationUrl: 'https://hubspot.com/certification',
          },
        ],
        languages: [
          { language: 'English', proficiency: 'native' },
          { language: 'German', proficiency: 'conversational' },
        ],
        portfolio: [
          {
            title: 'E-commerce SEO Campaign',
            description: 'Increased organic traffic by 300% for e-commerce store. Ranked #1 for 50+ keywords.',
            images: [],
            technologies: ['SEO', 'Google Analytics', 'Ahrefs'],
            projectUrl: 'https://ecommerce-seo-demo.example.com',
            completedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'SaaS Growth Campaign',
            description: 'Grew SaaS startup from 0 to 10k MRR in 6 months using paid ads and content marketing.',
            images: [],
            technologies: ['Google Ads', 'Facebook Ads', 'Content Marketing'],
            projectUrl: 'https://saas-growth-demo.example.com',
            completedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      rating: { average: 4.9, count: 25 },
    },
  ];

  return freelancers;
}

/**
 * Generate reviews for freelancers
 */
export async function generateReviewsForFreelancers(freelancerIds: any[], clientIds: any[]) {
  const reviews = [];
  const feedbackTemplates = [
    'Excellent work! Delivered exactly what was requested on time.',
    'Very professional and responsive. Highly recommended!',
    'Great communication and high-quality deliverables.',
    'Exceeded expectations. Will hire again!',
    'Outstanding attention to detail. Perfect execution.',
    'Reliable, skilled, and easy to work with.',
    'Delivered exceptional results. Top-tier professional.',
    'Impressed with the quality and speed of delivery.',
    'Highly skilled and very responsive to feedback.',
    'Perfect! Exactly what we needed. Great value.',
  ];

  // Generate 5-8 reviews per freelancer
  for (let i = 0; i < freelancerIds.length; i++) {
    const reviewCount = 5 + Math.floor(Math.random() * 4);
    for (let j = 0; j < reviewCount; j++) {
      reviews.push({
        freelancer: freelancerIds[i],
        client: clientIds[j % clientIds.length],
        reviewer: clientIds[j % clientIds.length],
        rating: 4 + Math.random(),
        feedback: feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)],
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      });
    }
  }

  return reviews;
}
