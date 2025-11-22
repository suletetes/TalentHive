import bcrypt from 'bcryptjs';

/**
 * Generate 50+ diverse users for comprehensive seed data
 */
export async function generateEnhancedUsers() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const firstNames = {
    male: ['James', 'Michael', 'Robert', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin', 'Brian'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'],
  };

  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark'];

  const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL', 'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Portland, OR', 'Miami, FL', 'Atlanta, GA', 'Nashville, TN', 'Detroit, MI'];

  const freelancerTitles = [
    'Full-Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Mobile App Developer',
    'UI/UX Designer',
    'Graphic Designer',
    'Content Writer',
    'Copywriter',
    'Digital Marketer',
    'SEO Specialist',
    'Data Scientist',
    'DevOps Engineer',
    'QA Engineer',
    'Product Manager',
    'Business Analyst',
    'Video Editor',
    '3D Artist',
    'Animator',
    'Voice Over Artist',
    'Translator',
  ];

  const skills = {
    developer: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Vue.js', 'Angular', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'GraphQL', 'REST API'],
    designer: ['Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'After Effects', 'Premiere Pro', 'UI Design', 'UX Design', 'Prototyping', 'Wireframing', 'Design Systems', 'Branding', 'Logo Design', 'Web Design', 'Mobile Design'],
    writer: ['Content Writing', 'Copywriting', 'Technical Writing', 'Blog Writing', 'SEO Writing', 'Creative Writing', 'Editing', 'Proofreading', 'Research', 'Storytelling'],
    marketing: ['Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Email Marketing', 'Content Marketing', 'PPC', 'Google Analytics', 'Facebook Ads', 'Google Ads'],
    data: ['Python', 'R', 'SQL', 'Machine Learning', 'Data Analysis', 'Data Visualization', 'Tableau', 'Power BI', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy'],
  };

  const users = [];

  // Generate 25 freelancers
  for (let i = 0; i < 25; i++) {
    const gender = i % 2 === 0 ? 'male' : 'female';
    const firstName = firstNames[gender][i % firstNames[gender].length];
    const lastName = lastNames[i % lastNames.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@freelancer.com`;
    const title = freelancerTitles[i % freelancerTitles.length];
    const location = cities[i % cities.length];
    
    let skillSet: string[] = [];
    if (title.includes('Developer') || title.includes('Engineer')) {
      skillSet = skills.developer.slice(0, 8 + (i % 5));
    } else if (title.includes('Designer') || title.includes('Artist')) {
      skillSet = skills.designer.slice(0, 8 + (i % 5));
    } else if (title.includes('Writer')) {
      skillSet = skills.writer.slice(0, 6 + (i % 4));
    } else if (title.includes('Marketing') || title.includes('SEO')) {
      skillSet = skills.marketing.slice(0, 6 + (i % 4));
    } else if (title.includes('Data')) {
      skillSet = skills.data.slice(0, 8 + (i % 4));
    } else {
      skillSet = skills.developer.slice(0, 6);
    }

    users.push({
      email,
      password: hashedPassword,
      role: 'freelancer',
      accountStatus: 'active',
      isEmailVerified: true,
      isVerified: i % 3 === 0, // 1/3 are verified
      profile: {
        firstName,
        lastName,
        bio: `Experienced ${title} with ${3 + (i % 8)} years of professional experience. Passionate about delivering high-quality work and exceeding client expectations.`,
        location,
        timezone: 'America/New_York',
      },
      freelancerProfile: {
        title,
        hourlyRate: 30 + (i * 5) % 100,
        skills: skillSet,
        experience: `${3 + (i % 8)}+ years of professional experience in ${title.toLowerCase()}.`,
        availability: {
          status: i % 4 === 0 ? 'busy' : 'available',
        },
      },
      rating: {
        average: 3.5 + (i % 15) / 10,
        count: i % 20,
      },
    });
  }

  // Generate 20 clients
  for (let i = 0; i < 20; i++) {
    const gender = i % 2 === 0 ? 'female' : 'male';
    const firstName = firstNames[gender][i % firstNames[gender].length];
    const lastName = lastNames[(i + 5) % lastNames.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@client.com`;
    const location = cities[(i + 10) % cities.length];
    
    const companyTypes = ['Tech Startup', 'E-commerce Company', 'Marketing Agency', 'Consulting Firm', 'SaaS Company', 'Enterprise', 'Small Business', 'Non-Profit'];
    const companyType = companyTypes[i % companyTypes.length];

    users.push({
      email,
      password: hashedPassword,
      role: 'client',
      accountStatus: 'active',
      isEmailVerified: true,
      profile: {
        firstName,
        lastName,
        bio: `${['CEO', 'CTO', 'Project Manager', 'Product Manager', 'Founder'][i % 5]} at ${companyType}. Looking for talented professionals to help grow our business.`,
        location,
      },
    });
  }

  return users;
}

/**
 * Generate additional projects for comprehensive seed data
 */
export function generateAdditionalProjects(users: any[], categories: any[]) {
  const projects = [];
  const clients = users.filter(u => u.role === 'client');
  
  const projectTitles = [
    'Build a Modern E-commerce Website',
    'Mobile App Development for iOS and Android',
    'Redesign Company Website',
    'Create Marketing Campaign',
    'Develop REST API Backend',
    'Design Logo and Brand Identity',
    'Write Technical Documentation',
    'SEO Optimization for Website',
    'Build Real-time Chat Application',
    'Create Video Marketing Content',
    'Develop Chrome Extension',
    'Design Mobile App UI/UX',
    'Build Admin Dashboard',
    'Create Social Media Content',
    'Develop WordPress Plugin',
    'Design Email Templates',
    'Build Landing Page',
    'Create Animated Explainer Video',
    'Develop Payment Integration',
    'Design Product Packaging',
  ];

  const descriptions = [
    'We need an experienced professional to help us with this project. The ideal candidate should have strong portfolio and excellent communication skills.',
    'Looking for a talented individual who can deliver high-quality work within the specified timeline. Attention to detail is crucial.',
    'Seeking a creative professional to bring our vision to life. Must be able to work independently and provide regular updates.',
    'We are looking for someone with proven experience in this field. The project requires both technical skills and creative thinking.',
    'Need a reliable professional who can start immediately. Long-term collaboration possible for the right candidate.',
  ];

  const skillSets = [
    ['React', 'Node.js', 'MongoDB', 'TypeScript'],
    ['React Native', 'Firebase', 'Redux'],
    ['Figma', 'UI Design', 'Prototyping'],
    ['Content Writing', 'SEO', 'Research'],
    ['Python', 'Data Analysis', 'Machine Learning'],
    ['Docker', 'Kubernetes', 'AWS'],
    ['Video Editing', 'Adobe Premiere', 'After Effects'],
    ['Solidity', 'Smart Contracts', 'Web3'],
  ];

  // Generate 80 additional projects
  for (let i = 0; i < 80; i++) {
    const client = clients[i % clients.length];
    const category = categories[i % categories.length];
    const title = projectTitles[i % projectTitles.length] + ` ${i + 1}`;
    const description = descriptions[i % descriptions.length];
    
    const statuses = ['open', 'in_progress', 'completed', 'cancelled'];
    const status = statuses[i % 4];
    
    const budgetMin = 500 + (i * 100) % 5000;
    const budgetMax = budgetMin + 1000 + (i * 200) % 3000;

    projects.push({
      title,
      description,
      client: client._id,
      category: category._id,
      skills: skillSets[i % skillSets.length],
      budget: {
        type: i % 2 === 0 ? 'fixed' : 'hourly',
        min: budgetMin,
        max: budgetMax,
        currency: 'USD',
      },
      timeline: {
        duration: 7 + (i % 60),
        unit: 'days',
      },
      status,
      visibility: 'public',
      experienceLevel: ['entry', 'intermediate', 'expert'][i % 3],
      projectType: ['one_time', 'ongoing'][i % 2],
      attachments: [],
      proposals: [],
      createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
    });
  }

  return projects;
}

/**
 * Generate additional proposals
 */
export function generateAdditionalProposals(freelancers: any[], projects: any[]) {
  const proposals = [];
  const usedCombinations = new Set<string>();
  
  const coverLetters = [
    'I am very interested in this project and believe I am the perfect fit. With my extensive experience and proven track record, I can deliver exceptional results.',
    'Hello! I have carefully reviewed your project requirements and I am confident I can exceed your expectations. I have successfully completed similar projects in the past.',
    'Hi there! I would love to work on this project. My skills and experience align perfectly with your needs, and I am committed to delivering high-quality work.',
    'Greetings! I am excited about this opportunity and ready to start immediately. I have the necessary skills and experience to complete this project successfully.',
    'Dear Client, I am a professional with extensive experience in this field. I guarantee timely delivery and excellent communication throughout the project.',
  ];

  // Calculate maximum possible unique proposals (each freelancer can only submit one per project)
  const maxPossibleProposals = Math.min(150, freelancers.length * projects.length);
  
  // Generate proposals, ensuring no duplicates per project-freelancer combination
  let proposalCount = 0;

  for (let i = 0; i < maxPossibleProposals && proposalCount < 150; i++) {
    const freelancerIndex = i % freelancers.length;
    const projectIndex = Math.floor(i / freelancers.length) % projects.length;
    
    const freelancer = freelancers[freelancerIndex];
    const project = projects[projectIndex];
    const combinationKey = `${project._id}-${freelancer._id}`;
    
    // Skip if this combination already exists
    if (usedCombinations.has(combinationKey)) {
      continue;
    }
    
    usedCombinations.add(combinationKey);
    
    const coverLetter = coverLetters[proposalCount % coverLetters.length];
    const statuses = ['submitted', 'accepted', 'rejected', 'withdrawn'];
    const status = statuses[proposalCount % 4];
    
    const budgetRange = project.budget.max - project.budget.min;
    const bidAmount = project.budget.min + (proposalCount * 100) % Math.max(budgetRange, 1);

    proposals.push({
      project: project._id,
      freelancer: freelancer._id,
      coverLetter,
      bidAmount,
      timeline: {
        duration: Math.max(1, project.timeline.duration - (proposalCount % 10)),
        unit: project.timeline.unit,
      },
      milestones: [],
      status,
      submittedAt: new Date(Date.now() - ((proposalCount + 1) * 12 * 60 * 60 * 1000)),
    });
    
    proposalCount++;
  }

  return proposals;
}
