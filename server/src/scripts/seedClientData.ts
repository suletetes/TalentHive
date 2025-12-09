import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { Contract } from '@/models/Contract';
import { Review } from '@/models/Review';
import { Category } from '@/models/Category';
import { Skill } from '@/models/Skill';
import { logger } from '@/utils/logger';

/**
 * Seed projects and reviews for client users
 */
export async function seedClientProjectsAndReviews() {
  logger.info('📋 Seeding client projects and reviews...');

  const clients = await User.find({ role: 'client', isActive: true });
  const freelancers = await User.find({ role: 'freelancer', isActive: true });
  const categories = await Category.find();
  const skills = await Skill.find();

  if (clients.length === 0 || freelancers.length === 0) {
    logger.warn('⚠️  No clients or freelancers found. Skipping client data seed.');
    return;
  }

  const projectTitles = [
    'E-commerce Website Development',
    'Mobile App for Food Delivery',
    'Company Website Redesign',
    'Custom CRM System',
    'Marketing Website with Blog',
    'Real Estate Platform',
    'Social Media Management Dashboard',
    'Inventory Management System',
    'Online Learning Platform',
    'Booking and Reservation System',
    'Portfolio Website',
    'Corporate Branding Package',
    'SEO Optimization Project',
    'Content Writing for Blog',
    'Video Editing for Marketing',
  ];

  const projectDescriptions = [
    'Looking for an experienced developer to build a modern e-commerce platform with payment integration.',
    'Need a mobile app developer to create a food delivery application for iOS and Android.',
    'Our company website needs a complete redesign with modern UI/UX principles.',
    'Seeking a developer to build a custom CRM system tailored to our business needs.',
    'Need a professional website with integrated blog and SEO optimization.',
    'Looking for a full-stack developer to build a real estate listing platform.',
    'Need a dashboard to manage multiple social media accounts and analytics.',
    'Seeking a developer to create an inventory management system with reporting.',
    'Looking for an experienced developer to build an online course platform.',
    'Need a booking system with calendar integration and payment processing.',
    'Looking for a designer to create a stunning portfolio website.',
    'Need complete branding including logo, colors, and brand guidelines.',
    'Seeking an SEO expert to optimize our website for search engines.',
    'Need high-quality blog content written on various tech topics.',
    'Looking for a video editor to create marketing videos for social media.',
  ];

  const statuses = ['open', 'in-progress', 'completed', 'completed'];
  let projectsCreated = 0;
  let reviewsCreated = 0;

  for (const client of clients) {
    // Create 3-5 projects per client
    const numProjects = Math.floor(Math.random() * 3) + 3; // 3-5 projects

    for (let i = 0; i < numProjects; i++) {
      const titleIndex = Math.floor(Math.random() * projectTitles.length);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Select 3-5 random skills
      const projectSkills = [];
      const numSkills = Math.floor(Math.random() * 3) + 3;
      for (let j = 0; j < numSkills; j++) {
        const skill = skills[Math.floor(Math.random() * skills.length)];
        if (!projectSkills.includes(skill._id)) {
          projectSkills.push(skill._id);
        }
      }

      const budget = {
        min: Math.floor(Math.random() * 2000) + 500,
        max: Math.floor(Math.random() * 5000) + 2500,
        type: Math.random() > 0.5 ? 'fixed' : 'hourly',
      };

      const timeline = {
        duration: Math.floor(Math.random() * 60) + 14, // 14-74 days
        unit: 'days',
      };

      const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days

      const project = await Project.create({
        title: `${projectTitles[titleIndex]} - ${client.profile.firstName}`,
        description: projectDescriptions[titleIndex],
        client: client._id,
        category: category._id,
        skills: projectSkills,
        budget,
        timeline,
        status,
        acceptingProposals: status === 'open',
        createdAt,
        updatedAt: createdAt,
      });

      projectsCreated++;

      // If project is completed, create a contract and review
      if (status === 'completed') {
        const freelancer = freelancers[Math.floor(Math.random() * freelancers.length)];
        
        const contractStartDate = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after project
        const contractEndDate = new Date(contractStartDate.getTime() + timeline.duration * 24 * 60 * 60 * 1000);

        // Create a proposal first (required by Contract model)
        const Proposal = (await import('@/models/Proposal')).Proposal;
        const proposal = await Proposal.create({
          project: project._id,
          freelancer: freelancer._id,
          coverLetter: `I am excited to work on this project. With my experience and expertise, I can deliver high-quality results that exceed your expectations. I have successfully completed similar projects in the past.`,
          bidAmount: budget.max,
          timeline: {
            duration: timeline.duration,
            unit: 'days',
          },
          milestones: [
            {
              title: 'Project Setup',
              description: 'Initial setup and planning',
              amount: budget.max * 0.3,
            },
            {
              title: 'Development',
              description: 'Main development work',
              amount: budget.max * 0.5,
            },
            {
              title: 'Final Delivery',
              description: 'Testing and final delivery',
              amount: budget.max * 0.2,
            },
          ],
          status: 'accepted',
          submittedAt: new Date(createdAt.getTime() + 1 * 24 * 60 * 60 * 1000),
          respondedAt: contractStartDate,
        });

        // Create contract with proper schema
        const contract = await Contract.create({
          project: project._id,
          client: client._id,
          freelancer: freelancer._id,
          proposal: proposal._id,
          sourceType: 'proposal',
          title: project.title,
          description: project.description,
          totalAmount: budget.max,
          currency: 'USD',
          startDate: contractStartDate,
          endDate: contractEndDate,
          status: 'completed',
          terms: {
            paymentTerms: 'Payment will be released upon milestone completion and client approval.',
            cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
            intellectualProperty: 'All work product created under this contract will be owned by the client.',
            confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
            disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
          },
          milestones: [
            {
              title: 'Project Setup',
              description: 'Initial setup and planning',
              amount: budget.max * 0.3,
              dueDate: new Date(contractStartDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              status: 'paid',
              submittedAt: new Date(contractStartDate.getTime() + 6 * 24 * 60 * 60 * 1000),
              approvedAt: new Date(contractStartDate.getTime() + 6.5 * 24 * 60 * 60 * 1000),
              paidAt: new Date(contractStartDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Development',
              description: 'Main development work',
              amount: budget.max * 0.5,
              dueDate: new Date(contractStartDate.getTime() + 21 * 24 * 60 * 60 * 1000),
              status: 'paid',
              submittedAt: new Date(contractStartDate.getTime() + 20 * 24 * 60 * 60 * 1000),
              approvedAt: new Date(contractStartDate.getTime() + 20.5 * 24 * 60 * 60 * 1000),
              paidAt: new Date(contractStartDate.getTime() + 21 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Final Delivery',
              description: 'Testing and final delivery',
              amount: budget.max * 0.2,
              dueDate: contractEndDate,
              status: 'paid',
              submittedAt: new Date(contractEndDate.getTime() - 1 * 24 * 60 * 60 * 1000),
              approvedAt: new Date(contractEndDate.getTime() - 0.5 * 24 * 60 * 60 * 1000),
              paidAt: contractEndDate,
            },
          ],
          createdAt: contractStartDate,
          updatedAt: contractEndDate,
        });

        // Create review from client to freelancer
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
        const feedbacks = [
          'Excellent work! Very professional and delivered on time. The quality exceeded our expectations.',
          'Great communication and quality work. Highly recommended! Would definitely hire again.',
          'Outstanding developer. Exceeded expectations and delivered ahead of schedule.',
          'Very satisfied with the results. Will hire again for future projects.',
          'Professional, skilled, and reliable. Great experience working together!',
          'Delivered exactly what we needed. Very happy with the outcome and attention to detail.',
          'Fantastic work! Very responsive and easy to work with throughout the project.',
          'High quality work and great attention to detail. Excellent communication skills.',
        ];

        await Review.create({
          project: project._id,
          contract: contract._id,
          reviewer: client._id,
          reviewee: freelancer._id,
          rating,
          feedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
          categories: {
            communication: rating,
            quality: rating,
            professionalism: rating,
            deadlines: rating,
          },
          isPublic: true,
          status: 'published',
          createdAt: new Date(contractEndDate.getTime() + 24 * 60 * 60 * 1000), // 1 day after completion
        });

        reviewsCreated++;

        // Update project status
        project.status = 'completed';
        await project.save();
      }
    }
  }

  logger.info(`✅ Created ${projectsCreated} projects for clients`);
  logger.info(`✅ Created ${reviewsCreated} reviews from clients`);
}
