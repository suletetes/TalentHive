import mongoose from 'mongoose';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { Review } from '@/models/Review';
import { Contract } from '@/models/Contract';
import { Proposal } from '@/models/Proposal';
import { Category } from '@/models/Category';
import { logger } from '@/utils/logger';

/**
 * Seed additional projects and reviews for clients
 * This ensures clients have:
 * - Posted projects (both active and completed)
 * - Reviews given to freelancers (tied to completed projects)
 */
export async function seedClientProjectsAndReviews() {
  logger.info(' Seeding client-specific data (projects & reviews)...');

  // Get all clients
  const clients = await User.find({ role: 'client' });
  const freelancers = await User.find({ role: 'freelancer' });
  const categories = await Category.find();
  
  if (clients.length === 0 || freelancers.length === 0) {
    logger.warn(' No clients or freelancers found. Skipping client data seeding.');
    return;
  }

  let projectsCreated = 0;
  let reviewsCreated = 0;

  // For each client, create 3-5 completed projects with reviews
  for (const client of clients) {
    const numProjects = 3 + Math.floor(Math.random() * 3); // 3-5 projects

    for (let i = 0; i < numProjects; i++) {
      // Pick a random freelancer
      const freelancer = freelancers[Math.floor(Math.random() * freelancers.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      // Create completed project
      const project = await Project.create({
        title: `${category.name} Project ${i + 1}`,
        description: `Completed ${category.name.toLowerCase()} project for ${client.profile.firstName}`,
        client: client._id,
        category: category._id,
        skills: [],
        budget: {
          type: 'fixed',
          min: 1000 + (i * 500),
          max: 2000 + (i * 500),
        },
        timeline: {
          duration: 14 + (i * 7),
          unit: 'days',
        },
        status: 'completed',
        selectedFreelancer: freelancer._id,
        completedAt: new Date(Date.now() - (30 + i * 10) * 24 * 60 * 60 * 1000),
      });

      projectsCreated++;

      // Create proposal for this project
      const proposal = await Proposal.create({
        project: project._id,
        freelancer: freelancer._id,
        coverLetter: `I would love to work on this ${category.name.toLowerCase()} project. I have extensive experience in this area.`,
        bidAmount: project.budget.max,
        timeline: project.timeline,
        status: 'accepted',
      });

      // Create contract for this project
      const contract = await Contract.create({
        project: project._id,
        client: client._id,
        freelancer: freelancer._id,
        proposal: proposal._id,
        sourceType: 'proposal',
        title: project.title,
        description: project.description,
        totalAmount: project.budget.max,
        currency: 'USD',
        startDate: new Date(Date.now() - (60 + i * 10) * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - (30 + i * 10) * 24 * 60 * 60 * 1000),
        status: 'completed',
        milestones: [{
          title: 'Project Completion',
          description: 'Complete the project as described',
          amount: project.budget.max,
          dueDate: new Date(Date.now() - (30 + i * 10) * 24 * 60 * 60 * 1000),
          status: 'paid',
        }],
        signatures: [
          {
            signedBy: client._id,
            signedAt: new Date(Date.now() - (60 + i * 10) * 24 * 60 * 60 * 1000),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            signatureHash: `client-sig-${project._id}`,
          },
          {
            signedBy: freelancer._id,
            signedAt: new Date(Date.now() - (60 + i * 10) * 24 * 60 * 60 * 1000),
            ipAddress: '192.168.1.2',
            userAgent: 'Mozilla/5.0',
            signatureHash: `freelancer-sig-${project._id}`,
          },
        ],
        terms: {
          paymentTerms: 'Payment will be released upon milestone completion and client approval.',
          cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
          intellectualProperty: 'All work product created under this contract will be owned by the client.',
          confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
          disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
        },
      });

      // Create review from client to freelancer (tied to project)
      const rating = 4 + Math.random(); // 4.0 - 5.0
      const feedbacks = [
        'Excellent work! Very professional and delivered on time.',
        'Great communication and high-quality deliverables.',
        'Very satisfied with the results. Would hire again!',
        'Professional and reliable. Exceeded expectations.',
        'Outstanding work quality. Highly recommended!',
      ];

      await Review.create({
        contract: contract._id,
        project: project._id,
        reviewer: client._id, // Client is the reviewer
        reviewee: freelancer._id, // Freelancer is being reviewed
        rating: rating,
        feedback: feedbacks[i % feedbacks.length],
        categories: {
          communication: 4 + Math.floor(Math.random() * 2),
          quality: 4 + Math.floor(Math.random() * 2),
          professionalism: 4 + Math.floor(Math.random() * 2),
          deadlines: 4 + Math.floor(Math.random() * 2),
        },
        isPublic: true,
      });

      reviewsCreated++;

      // Update freelancer rating
      const freelancerReviews = await Review.find({ reviewee: freelancer._id });
      const avgRating = freelancerReviews.reduce((sum, r) => sum + r.rating, 0) / freelancerReviews.length;
      freelancer.rating = {
        average: avgRating,
        count: freelancerReviews.length,
      };
      await freelancer.save();
    }
  }

  logger.info(` Created ${projectsCreated} completed projects for clients`);
  logger.info(` Created ${reviewsCreated} reviews given by clients`);
}
