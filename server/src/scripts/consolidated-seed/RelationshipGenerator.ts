import { logger } from '@/utils/logger';
import { 
  ProposalData, 
  DataGenerator, 
  GenerationContext, 
  ValidationResult,
  ProposalStatus,
  TimelineData,
  MilestoneData,
  UserData,
  ProjectData
} from './types';

/**
 * Generates realistic proposals and contracts with proper relationships
 * Ensures all foreign key relationships are properly established
 */
export class RelationshipGenerator implements DataGenerator<ProposalData> {
  
  /**
   * Generate proposals linked to appropriate projects and freelancers
   */
  async generate(count: number, context: GenerationContext): Promise<ProposalData[]> {
    const { existingData } = context;
    
    const users = existingData.get('users') as UserData[] || [];
    const projects = existingData.get('projects') as ProjectData[] || [];
    
    const freelancers = users.filter(user => user.role === 'freelancer');
    const openProjects = projects.filter(project => project.status === 'open');
    
    if (freelancers.length === 0) {
      throw new Error('No freelancers available for proposal generation');
    }
    
    if (openProjects.length === 0) {
      throw new Error('No open projects available for proposal generation');
    }

    logger.info(` Generating ${count} proposals for ${openProjects.length} open projects...`);
    
    const proposals: ProposalData[] = [];
    
    // Generate proposals with realistic distribution
    for (let i = 0; i < count; i++) {
      const project = this.selectRandomProject(openProjects);
      const freelancer = this.selectSuitableFreelancer(freelancers, project);
      
      if (!freelancer) {
        logger.warn(`No suitable freelancer found for project: ${project.title}`);
        continue;
      }

      const proposal = await this.generateProposal(project, freelancer);
      proposals.push(proposal);
    }

    logger.info(` Generated ${proposals.length} proposals`);
    return proposals;
  }

  /**
   * Generate a single proposal for a project and freelancer
   */
  private async generateProposal(project: ProjectData, freelancer: UserData): Promise<ProposalData> {
    const freelancerProfile = freelancer.freelancerProfile!;
    
    // Calculate bid amount based on project budget and freelancer rate
    const bidAmount = this.calculateBidAmount(project, freelancerProfile.hourlyRate);
    
    // Generate realistic timeline
    const timeline = this.generateTimeline(project);
    
    // Generate milestones
    const milestones = this.generateMilestones(project, bidAmount, timeline);
    
    // Generate cover letter
    const coverLetter = this.generateCoverLetter(project, freelancer);
    
    // Determine proposal status
    const status = this.generateProposalStatus();

    return {
      project: project as any, // Will be ObjectId in actual implementation
      freelancer: freelancer as any, // Will be ObjectId in actual implementation
      coverLetter,
      bidAmount,
      timeline,
      milestones,
      status
    };
  }

  /**
   * Calculate realistic bid amount based on project and freelancer rate
   */
  private calculateBidAmount(project: ProjectData, hourlyRate: number): number {
    const { budget, estimatedHours } = project;
    
    if (budget.type === 'hourly') {
      // For hourly projects, bid close to freelancer's rate within budget range
      const targetRate = Math.min(hourlyRate, budget.max);
      const minRate = Math.max(hourlyRate * 0.8, budget.min);
      return Math.round(Math.random() * (targetRate - minRate) + minRate);
    } else {
      // For fixed projects, calculate based on estimated hours and rate
      const baseAmount = estimatedHours * hourlyRate;
      const budgetMidpoint = (budget.min + budget.max) / 2;
      
      // Bid between 80% of calculated amount and budget midpoint
      const minBid = Math.max(baseAmount * 0.8, budget.min);
      const maxBid = Math.min(budgetMidpoint, budget.max);
      
      return Math.round(Math.random() * (maxBid - minBid) + minBid);
    }
  }

  /**
   * Generate realistic timeline for proposal
   */
  private generateTimeline(project: ProjectData): TimelineData {
    const baseTimeline = project.timeline;
    
    // Freelancers typically propose 10-20% faster or slower than client estimate
    const multiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const proposedDuration = Math.round(baseTimeline.duration * multiplier);
    
    return {
      duration: Math.max(1, proposedDuration),
      unit: baseTimeline.unit
    };
  }

  /**
   * Generate milestones for the proposal
   */
  private generateMilestones(project: ProjectData, totalAmount: number, timeline: TimelineData): MilestoneData[] {
    const milestones: MilestoneData[] = [];
    const milestoneCount = this.getMilestoneCount(project.complexity, totalAmount);
    
    const amountPerMilestone = totalAmount / milestoneCount;
    const daysPerMilestone = this.convertTimelineToDays(timeline) / milestoneCount;
    
    for (let i = 0; i < milestoneCount; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.round(daysPerMilestone * (i + 1)));
      
      milestones.push({
        title: this.generateMilestoneTitle(i + 1, milestoneCount, project),
        description: this.generateMilestoneDescription(i + 1, milestoneCount, project),
        amount: Math.round(amountPerMilestone),
        dueDate,
        status: 'pending'
      });
    }

    return milestones;
  }

  /**
   * Generate cover letter for proposal
   */
  private generateCoverLetter(project: ProjectData, freelancer: UserData): string {
    const freelancerProfile = freelancer.freelancerProfile!;
    const relevantSkills = this.getRelevantSkills(project.skills as string[], freelancerProfile.skills);
    
    const templates = [
      `Hi there! I'm excited about your ${project.title} project. With ${freelancerProfile.experience}, I have extensive experience in ${relevantSkills.slice(0, 3).join(', ')}. I've successfully delivered similar projects and would love to help bring your vision to life. Let's discuss how I can contribute to your project's success!`,
      
      `Hello! Your ${project.title} project caught my attention because it aligns perfectly with my expertise in ${relevantSkills.slice(0, 2).join(' and ')}. As a ${freelancerProfile.title.toLowerCase()}, I've helped numerous clients achieve their goals through quality work and clear communication. I'm confident I can deliver exceptional results for your project.`,
      
      `Greetings! I'm a ${freelancerProfile.title.toLowerCase()} with strong skills in ${relevantSkills.slice(0, 3).join(', ')}. Your ${project.title} project is exactly the type of work I excel at. I pride myself on delivering high-quality solutions on time and within budget. I'd love to discuss how my experience can benefit your project.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate realistic proposal status
   */
  private generateProposalStatus(): ProposalStatus {
    const statusWeights = {
      submitted: 0.6,  // 60% submitted (pending review)
      accepted: 0.15,  // 15% accepted
      rejected: 0.20,  // 20% rejected
      withdrawn: 0.05  // 5% withdrawn
    };

    const random = Math.random();
    let cumulative = 0;

    for (const [status, weight] of Object.entries(statusWeights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return status as ProposalStatus;
      }
    }

    return 'submitted';
  }

  /**
   * Select a random project for proposal
   */
  private selectRandomProject(projects: ProjectData[]): ProjectData {
    return projects[Math.floor(Math.random() * projects.length)];
  }

  /**
   * Select a suitable freelancer for the project based on skills
   */
  private selectSuitableFreelancer(freelancers: UserData[], project: ProjectData): UserData | null {
    // Filter freelancers who have at least one matching skill
    const suitableFreelancers = freelancers.filter(freelancer => {
      if (!freelancer.freelancerProfile) return false;
      
      const freelancerSkills = freelancer.freelancerProfile.skills;
      const projectSkills = project.skills as string[];
      
      return projectSkills.some(skill => 
        freelancerSkills.some(fSkill => 
          fSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(fSkill.toLowerCase())
        )
      );
    });

    if (suitableFreelancers.length === 0) {
      // Fallback to any freelancer if no perfect match
      return freelancers[Math.floor(Math.random() * freelancers.length)];
    }

    return suitableFreelancers[Math.floor(Math.random() * suitableFreelancers.length)];
  }

  /**
   * Get relevant skills between project and freelancer
   */
  private getRelevantSkills(projectSkills: string[], freelancerSkills: string[]): string[] {
    return freelancerSkills.filter(fSkill =>
      projectSkills.some(pSkill =>
        fSkill.toLowerCase().includes(pSkill.toLowerCase()) ||
        pSkill.toLowerCase().includes(fSkill.toLowerCase())
      )
    );
  }

  /**
   * Determine number of milestones based on project complexity and amount
   */
  private getMilestoneCount(complexity: string, amount: number): number {
    if (amount < 500) return 1;
    if (amount < 2000) return 2;
    if (complexity === 'simple') return 2;
    if (complexity === 'moderate') return 3;
    if (complexity === 'complex') return 4;
    return 5; // enterprise
  }

  /**
   * Convert timeline to days for milestone calculation
   */
  private convertTimelineToDays(timeline: TimelineData): number {
    switch (timeline.unit) {
      case 'days': return timeline.duration;
      case 'weeks': return timeline.duration * 7;
      case 'months': return timeline.duration * 30;
      default: return timeline.duration;
    }
  }

  /**
   * Generate milestone title
   */
  private generateMilestoneTitle(index: number, total: number, project: ProjectData): string {
    const titles = {
      1: total === 1 ? 'Project Completion' : 'Project Setup & Planning',
      2: total === 2 ? 'Final Delivery' : 'Development Phase 1',
      3: total === 3 ? 'Final Delivery & Testing' : 'Development Phase 2',
      4: total === 4 ? 'Final Delivery & Launch' : 'Testing & Refinement',
      5: 'Final Delivery & Support'
    };

    return titles[index as keyof typeof titles] || `Milestone ${index}`;
  }

  /**
   * Generate milestone description
   */
  private generateMilestoneDescription(index: number, total: number, project: ProjectData): string {
    const descriptions = {
      1: total === 1 
        ? 'Complete project delivery including all requirements and testing'
        : 'Initial project setup, requirements analysis, and development planning',
      2: total === 2
        ? 'Final implementation, testing, and project delivery'
        : 'Core functionality development and initial testing',
      3: total === 3
        ? 'Final testing, bug fixes, and complete project delivery'
        : 'Additional features implementation and integration',
      4: total === 4
        ? 'Final delivery, documentation, and project launch'
        : 'Comprehensive testing, optimization, and bug fixes',
      5: 'Final delivery, documentation, and post-launch support'
    };

    return descriptions[index as keyof typeof descriptions] || `Milestone ${index} completion`;
  }

  /**
   * Validate generated proposal data
   */
  validate(data: ProposalData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const proposal = data[i];
      const prefix = `Proposal ${i + 1}`;

      // Required fields validation
      if (!proposal.project) {
        errors.push(`${prefix}: Project reference is required`);
      }
      if (!proposal.freelancer) {
        errors.push(`${prefix}: Freelancer reference is required`);
      }
      if (!proposal.coverLetter || proposal.coverLetter.length < 50) {
        errors.push(`${prefix}: Cover letter must be at least 50 characters`);
      }
      if (!proposal.bidAmount || proposal.bidAmount <= 0) {
        errors.push(`${prefix}: Bid amount must be positive`);
      }
      if (!proposal.timeline || !proposal.timeline.duration || proposal.timeline.duration <= 0) {
        errors.push(`${prefix}: Timeline duration must be positive`);
      }
      if (!proposal.milestones || proposal.milestones.length === 0) {
        errors.push(`${prefix}: At least one milestone is required`);
      }

      // Business logic validation
      if (proposal.bidAmount > 50000) {
        warnings.push(`${prefix}: Bid amount seems very high (${proposal.bidAmount})`);
      }
      if (proposal.timeline.duration > 365) {
        warnings.push(`${prefix}: Timeline seems very long (${proposal.timeline.duration} ${proposal.timeline.unit})`);
      }

      // Milestone validation
      if (proposal.milestones) {
        const totalMilestoneAmount = proposal.milestones.reduce((sum, m) => sum + m.amount, 0);
        const amountDifference = Math.abs(totalMilestoneAmount - proposal.bidAmount);
        if (amountDifference > proposal.bidAmount * 0.01) { // Allow 1% variance
          errors.push(`${prefix}: Milestone amounts don't match bid amount`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get dependencies for relationship generation
   */
  getDependencies(): string[] {
    return ['users', 'projects'];
  }
}