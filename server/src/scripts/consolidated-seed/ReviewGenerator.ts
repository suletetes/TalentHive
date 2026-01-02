import { logger } from '@/utils/logger';
import { 
  DataGenerator, 
  GenerationContext, 
  ValidationResult,
  UserData
} from './types';
import { ContractData } from './ContractGenerator';

/**
 * Review data structure for generation
 */
export interface ReviewData {
  contract: any; // ObjectId reference to contract
  reviewer: any; // ObjectId reference to reviewer (client or freelancer)
  reviewee: any; // ObjectId reference to reviewee (freelancer or client)
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  reviewType: 'client_to_freelancer' | 'freelancer_to_client';
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generates reviews only for completed contracts and maintains accurate user ratings
 * Ensures rating calculations match mathematical averages
 */
export class ReviewGenerator implements DataGenerator<ReviewData> {
  
  /**
   * Generate reviews for completed contracts
   */
  async generate(count: number, context: GenerationContext): Promise<ReviewData[]> {
    const { existingData } = context;
    
    const contracts = existingData.get('contracts') as ContractData[] || [];
    const users = existingData.get('users') as UserData[] || [];
    
    // Only create reviews for completed contracts
    const completedContracts = contracts.filter(contract => contract.status === 'completed');
    
    if (completedContracts.length === 0) {
      logger.warn('No completed contracts available for review generation');
      return [];
    }

    logger.info(` Generating reviews for ${completedContracts.length} completed contracts...`);
    
    const reviews: ReviewData[] = [];
    
    for (const contract of completedContracts) {
      // Generate both client-to-freelancer and freelancer-to-client reviews
      // Not all contracts get both reviews (realistic scenario)
      
      // Client reviews freelancer (90% chance)
      if (Math.random() > 0.1) {
        const clientReview = await this.generateClientToFreelancerReview(contract, users);
        if (clientReview) {
          reviews.push(clientReview);
        }
      }
      
      // Freelancer reviews client (70% chance)
      if (Math.random() > 0.3) {
        const freelancerReview = await this.generateFreelancerToClientReview(contract, users);
        if (freelancerReview) {
          reviews.push(freelancerReview);
        }
      }
      
      // Stop if we've reached the requested count
      if (reviews.length >= count) {
        break;
      }
    }

    logger.info(` Generated ${reviews.length} reviews`);
    
    // Update user ratings based on generated reviews
    await this.updateUserRatings(reviews, users);
    
    return reviews.slice(0, count);
  }

  /**
   * Generate client review for freelancer
   */
  private async generateClientToFreelancerReview(contract: ContractData, users: UserData[]): Promise<ReviewData | null> {
    const client = this.findUserById(users, contract.client);
    const freelancer = this.findUserById(users, contract.freelancer);
    
    if (!client || !freelancer) {
      logger.warn('Unable to find client or freelancer for review generation');
      return null;
    }

    const rating = this.generateClientRating();
    const { title, comment } = this.generateClientReviewContent(rating, freelancer, contract);
    
    return {
      contract: contract as any,
      reviewer: client as any,
      reviewee: freelancer as any,
      rating,
      title,
      comment,
      reviewType: 'client_to_freelancer',
      isPublic: Math.random() > 0.1, // 90% public
      createdAt: this.generateReviewDate(contract.endDate || contract.updatedAt),
      updatedAt: this.generateReviewDate(contract.endDate || contract.updatedAt)
    };
  }

  /**
   * Generate freelancer review for client
   */
  private async generateFreelancerToClientReview(contract: ContractData, users: UserData[]): Promise<ReviewData | null> {
    const client = this.findUserById(users, contract.client);
    const freelancer = this.findUserById(users, contract.freelancer);
    
    if (!client || !freelancer) {
      logger.warn('Unable to find client or freelancer for review generation');
      return null;
    }

    const rating = this.generateFreelancerRating();
    const { title, comment } = this.generateFreelancerReviewContent(rating, client, contract);
    
    return {
      contract: contract as any,
      reviewer: freelancer as any,
      reviewee: client as any,
      rating,
      title,
      comment,
      reviewType: 'freelancer_to_client',
      isPublic: Math.random() > 0.15, // 85% public
      createdAt: this.generateReviewDate(contract.endDate || contract.updatedAt),
      updatedAt: this.generateReviewDate(contract.endDate || contract.updatedAt)
    };
  }

  /**
   * Generate realistic client rating (tends to be positive)
   */
  private generateClientRating(): number {
    // Client ratings distribution: mostly positive
    const weights = {
      5: 0.45, // 45% - 5 stars
      4: 0.30, // 30% - 4 stars  
      3: 0.15, // 15% - 3 stars
      2: 0.07, // 7% - 2 stars
      1: 0.03  // 3% - 1 star
    };

    const random = Math.random();
    let cumulative = 0;

    for (const [rating, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return parseInt(rating);
      }
    }

    return 5; // fallback
  }

  /**
   * Generate realistic freelancer rating (also tends to be positive)
   */
  private generateFreelancerRating(): number {
    // Freelancer ratings distribution: slightly more positive than client ratings
    const weights = {
      5: 0.50, // 50% - 5 stars
      4: 0.35, // 35% - 4 stars
      3: 0.10, // 10% - 3 stars
      2: 0.04, // 4% - 2 stars
      1: 0.01  // 1% - 1 star
    };

    const random = Math.random();
    let cumulative = 0;

    for (const [rating, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return parseInt(rating);
      }
    }

    return 5; // fallback
  }

  /**
   * Generate client review content based on rating
   */
  private generateClientReviewContent(rating: number, freelancer: UserData, contract: ContractData): { title: string; comment: string } {
    const freelancerName = freelancer.profile.firstName;
    const freelancerTitle = freelancer.freelancerProfile?.title || 'Developer';
    
    const contentByRating = {
      5: {
        titles: [
          'Exceptional work and communication!',
          'Outstanding results, highly recommended!',
          'Perfect execution, will hire again!',
          'Exceeded all expectations!',
          'Top-notch professional work!'
        ],
        comments: [
          `${freelancerName} delivered exceptional work on our project. The quality exceeded our expectations and communication was excellent throughout. Highly recommended!`,
          `Outstanding ${freelancerTitle.toLowerCase()}! ${freelancerName} completed the project ahead of schedule with perfect attention to detail. Will definitely work together again.`,
          `Fantastic experience working with ${freelancerName}. Professional, skilled, and delivered exactly what we needed. The project was completed flawlessly.`,
          `${freelancerName} is a true professional. Excellent communication, high-quality work, and delivered on time. Couldn't be happier with the results!`
        ]
      },
      4: {
        titles: [
          'Great work and good communication',
          'Very satisfied with the results',
          'Professional and reliable',
          'Good quality work delivered',
          'Solid performance overall'
        ],
        comments: [
          `${freelancerName} did great work on our project. Good communication and delivered quality results. Would recommend for similar projects.`,
          `Very pleased with ${freelancerName}'s work. Professional approach and good attention to detail. Minor revisions were handled promptly.`,
          `Solid work from ${freelancerName}. The project was completed as requested with good quality. Communication could have been slightly better but overall very satisfied.`,
          `${freelancerName} delivered good results on time. Professional ${freelancerTitle.toLowerCase()} with solid technical skills. Would consider for future projects.`
        ]
      },
      3: {
        titles: [
          'Decent work, some issues',
          'Average performance',
          'Acceptable results',
          'Mixed experience',
          'Okay work overall'
        ],
        comments: [
          `${freelancerName} completed the work but there were some communication issues and minor quality concerns. Results were acceptable overall.`,
          `Average experience with ${freelancerName}. The work was completed but required several revisions. Communication could be improved.`,
          `${freelancerName} delivered the project but it took longer than expected and required additional clarifications. Final result was acceptable.`,
          `Mixed experience. ${freelancerName} has good technical skills but project management and communication need improvement.`
        ]
      },
      2: {
        titles: [
          'Below expectations',
          'Several issues encountered',
          'Disappointing experience',
          'Poor communication',
          'Quality concerns'
        ],
        comments: [
          `${freelancerName} struggled with communication and the work quality was below expectations. Required significant revisions and follow-up.`,
          `Disappointing experience. ${freelancerName} missed deadlines and the initial delivery had several issues that needed to be fixed.`,
          `Poor communication from ${freelancerName} throughout the project. Work quality was subpar and required extensive revisions.`,
          `${freelancerName} did not meet our expectations. Multiple issues with deliverables and very slow response times.`
        ]
      },
      1: {
        titles: [
          'Very poor experience',
          'Unacceptable work quality',
          'Major issues throughout',
          'Would not recommend',
          'Extremely disappointing'
        ],
        comments: [
          `Very poor experience with ${freelancerName}. Work was of unacceptable quality and communication was virtually non-existent.`,
          `${freelancerName} failed to deliver on promises. Multiple missed deadlines and the final work was completely unsatisfactory.`,
          `Extremely disappointing. ${freelancerName} did not follow project requirements and was unresponsive to feedback. Would not recommend.`,
          `Unacceptable work from ${freelancerName}. Project had to be redone by someone else. Poor communication and quality throughout.`
        ]
      }
    };

    const content = contentByRating[rating as keyof typeof contentByRating];
    const title = content.titles[Math.floor(Math.random() * content.titles.length)];
    const comment = content.comments[Math.floor(Math.random() * content.comments.length)];

    return { title, comment };
  }

  /**
   * Generate freelancer review content based on rating
   */
  private generateFreelancerReviewContent(rating: number, client: UserData, contract: ContractData): { title: string; comment: string } {
    const clientName = client.profile.firstName;
    
    const contentByRating = {
      5: {
        titles: [
          'Excellent client to work with!',
          'Clear requirements and great communication',
          'Professional and responsive client',
          'Perfect collaboration experience',
          'Highly recommend this client!'
        ],
        comments: [
          `${clientName} was an excellent client to work with. Clear requirements, prompt payments, and great communication throughout the project.`,
          `Outstanding experience working with ${clientName}. Professional, responsive, and provided clear feedback. Would love to work together again!`,
          `${clientName} is a fantastic client! Clear project scope, timely responses, and very professional. Highly recommend to other freelancers.`,
          `Perfect collaboration with ${clientName}. Excellent communication, clear expectations, and prompt payment. A pleasure to work with!`
        ]
      },
      4: {
        titles: [
          'Good client experience',
          'Professional and fair',
          'Smooth collaboration',
          'Satisfied with the project',
          'Good communication overall'
        ],
        comments: [
          `Good experience working with ${clientName}. Professional client with clear requirements. Minor delays in feedback but overall smooth project.`,
          `${clientName} was professional and fair throughout the project. Good communication and reasonable expectations. Would work with again.`,
          `Solid working relationship with ${clientName}. Project went smoothly with good communication and timely payments.`,
          `${clientName} provided clear direction and was responsive to questions. Professional client with realistic expectations.`
        ]
      },
      3: {
        titles: [
          'Average client experience',
          'Some communication issues',
          'Acceptable collaboration',
          'Mixed experience overall',
          'Decent client to work with'
        ],
        comments: [
          `Average experience with ${clientName}. Some communication delays and scope changes but project was completed successfully.`,
          `${clientName} was decent to work with but communication could have been better. Some unclear requirements led to revisions.`,
          `Mixed experience with ${clientName}. Professional but had some issues with changing requirements and delayed responses.`,
          `Acceptable working relationship with ${clientName}. Some challenges with communication but project was completed.`
        ]
      },
      2: {
        titles: [
          'Challenging client experience',
          'Poor communication',
          'Difficult collaboration',
          'Below average experience',
          'Several issues encountered'
        ],
        comments: [
          `Challenging experience with ${clientName}. Poor communication and frequent scope changes made the project difficult.`,
          `${clientName} was difficult to work with. Unclear requirements, delayed responses, and unrealistic expectations.`,
          `Poor communication from ${clientName} throughout the project. Multiple scope changes and delayed payments.`,
          `Difficult collaboration with ${clientName}. Inconsistent feedback and communication issues throughout the project.`
        ]
      },
      1: {
        titles: [
          'Very poor client experience',
          'Unprofessional behavior',
          'Would not work with again',
          'Extremely difficult client',
          'Unacceptable treatment'
        ],
        comments: [
          `Very poor experience with ${clientName}. Unprofessional behavior, delayed payments, and unreasonable demands.`,
          `${clientName} was extremely difficult to work with. Poor communication, unrealistic expectations, and payment issues.`,
          `Unacceptable experience with ${clientName}. Unprofessional conduct and multiple payment delays. Would not recommend.`,
          `Extremely poor client. ${clientName} was unresponsive, made unreasonable demands, and had payment issues. Avoid if possible.`
        ]
      }
    };

    const content = contentByRating[rating as keyof typeof contentByRating];
    const title = content.titles[Math.floor(Math.random() * content.titles.length)];
    const comment = content.comments[Math.floor(Math.random() * content.comments.length)];

    return { title, comment };
  }

  /**
   * Generate review date (1-7 days after contract completion)
   */
  private generateReviewDate(contractEndDate: Date): Date {
    const reviewDate = new Date(contractEndDate);
    const daysAfter = Math.floor(Math.random() * 7) + 1; // 1-7 days after
    reviewDate.setDate(reviewDate.getDate() + daysAfter);
    return reviewDate;
  }

  /**
   * Update user ratings based on generated reviews
   */
  private async updateUserRatings(reviews: ReviewData[], users: UserData[]): Promise<void> {
    const userRatings = new Map<any, { total: number; count: number }>();

    // Calculate ratings for each user
    for (const review of reviews) {
      const revieweeId = review.reviewee;
      
      if (!userRatings.has(revieweeId)) {
        userRatings.set(revieweeId, { total: 0, count: 0 });
      }
      
      const current = userRatings.get(revieweeId)!;
      current.total += review.rating;
      current.count += 1;
    }

    // Update user objects with calculated ratings
    for (const user of users) {
      const ratings = userRatings.get(user as any);
      if (ratings) {
        user.rating = {
          average: Math.round((ratings.total / ratings.count) * 10) / 10, // Round to 1 decimal
          count: ratings.count
        };
      }
    }

    logger.info(` Updated ratings for ${userRatings.size} users based on reviews`);
  }

  /**
   * Find user by ID (mock implementation)
   */
  private findUserById(users: UserData[], userId: any): UserData | undefined {
    // In real implementation, this would use ObjectId comparison
    return users.find(user => user === userId);
  }

  /**
   * Validate generated review data
   */
  validate(data: ReviewData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const review = data[i];
      const prefix = `Review ${i + 1}`;

      // Required fields validation
      if (!review.contract) {
        errors.push(`${prefix}: Contract reference is required`);
      }
      if (!review.reviewer) {
        errors.push(`${prefix}: Reviewer reference is required`);
      }
      if (!review.reviewee) {
        errors.push(`${prefix}: Reviewee reference is required`);
      }
      if (!review.rating || review.rating < 1 || review.rating > 5) {
        errors.push(`${prefix}: Rating must be between 1 and 5`);
      }
      if (!review.title || review.title.length < 5) {
        errors.push(`${prefix}: Title must be at least 5 characters`);
      }
      if (!review.comment || review.comment.length < 20) {
        errors.push(`${prefix}: Comment must be at least 20 characters`);
      }
      if (!['client_to_freelancer', 'freelancer_to_client'].includes(review.reviewType)) {
        errors.push(`${prefix}: Invalid review type`);
      }

      // Business logic validation
      if (review.reviewer === review.reviewee) {
        errors.push(`${prefix}: Reviewer and reviewee cannot be the same person`);
      }
      
      if (review.comment.length > 2000) {
        warnings.push(`${prefix}: Comment is very long (${review.comment.length} characters)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get dependencies for review generation
   */
  getDependencies(): string[] {
    return ['users', 'contracts'];
  }
}