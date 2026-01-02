import { logger } from '@/utils/logger';
import { 
  DataGenerator, 
  GenerationContext, 
  ValidationResult,
  ProposalData,
  UserData
} from './types';

/**
 * Contract data structure for generation
 */
export interface ContractData {
  proposal: any; // ObjectId reference to proposal
  client: any; // ObjectId reference to client
  freelancer: any; // ObjectId reference to freelancer
  project: any; // ObjectId reference to project
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  startDate: Date;
  endDate?: Date;
  totalAmount: number;
  milestones: ContractMilestone[];
  terms: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractMilestone {
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: Date;
  approvedAt?: Date;
}

/**
 * Generates contracts only for accepted proposals or hire-now requests
 * Ensures proper contract lifecycle and milestone management
 */
export class ContractGenerator implements DataGenerator<ContractData> {
  
  /**
   * Generate contracts from accepted proposals
   */
  async generate(count: number, context: GenerationContext): Promise<ContractData[]> {
    const { existingData } = context;
    
    const proposals = existingData.get('proposals') as ProposalData[] || [];
    const users = existingData.get('users') as UserData[] || [];
    
    // Only create contracts from accepted proposals
    const acceptedProposals = proposals.filter(proposal => proposal.status === 'accepted');
    
    if (acceptedProposals.length === 0) {
      logger.warn('No accepted proposals available for contract generation');
      return [];
    }

    logger.info(` Generating ${Math.min(count, acceptedProposals.length)} contracts from accepted proposals...`);
    
    const contracts: ContractData[] = [];
    const proposalsToUse = acceptedProposals.slice(0, count);
    
    for (const proposal of proposalsToUse) {
      const contract = await this.generateContract(proposal, users);
      contracts.push(contract);
    }

    logger.info(` Generated ${contracts.length} contracts`);
    return contracts;
  }

  /**
   * Generate a single contract from an accepted proposal
   */
  private async generateContract(proposal: ProposalData, users: UserData[]): Promise<ContractData> {
    const freelancer = this.findUserById(users, proposal.freelancer);
    const client = this.findClientForProject(users, proposal.project);
    
    if (!freelancer || !client) {
      throw new Error('Unable to find freelancer or client for contract generation');
    }

    // Generate contract dates
    const startDate = this.generateStartDate();
    const endDate = this.generateEndDate(startDate, proposal.timeline);
    
    // Generate contract status based on dates
    const status = this.generateContractStatus(startDate, endDate);
    
    // Convert proposal milestones to contract milestones
    const milestones = this.generateContractMilestones(proposal.milestones, startDate, status);
    
    // Generate contract terms
    const terms = this.generateContractTerms(proposal, freelancer, client);

    const now = new Date();
    
    return {
      proposal: proposal as any,
      client: client as any,
      freelancer: freelancer as any,
      project: proposal.project,
      status,
      startDate,
      endDate: status === 'completed' ? endDate : undefined,
      totalAmount: proposal.bidAmount,
      milestones,
      terms,
      createdAt: startDate,
      updatedAt: status === 'active' ? now : endDate || now
    };
  }

  /**
   * Generate realistic start date for contract
   */
  private generateStartDate(): Date {
    const now = new Date();
    // Contracts typically start 1-14 days after proposal acceptance
    const daysOffset = Math.floor(Math.random() * 14) + 1;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90)); // Some contracts started up to 90 days ago
    return startDate;
  }

  /**
   * Generate end date based on start date and timeline
   */
  private generateEndDate(startDate: Date, timeline: any): Date {
    const endDate = new Date(startDate);
    
    switch (timeline.unit) {
      case 'days':
        endDate.setDate(endDate.getDate() + timeline.duration);
        break;
      case 'weeks':
        endDate.setDate(endDate.getDate() + (timeline.duration * 7));
        break;
      case 'months':
        endDate.setMonth(endDate.getMonth() + timeline.duration);
        break;
    }
    
    return endDate;
  }

  /**
   * Generate contract status based on dates
   */
  private generateContractStatus(startDate: Date, endDate: Date): 'active' | 'completed' | 'cancelled' | 'disputed' {
    const now = new Date();
    
    // If contract hasn't started yet, it's active
    if (startDate > now) {
      return 'active';
    }
    
    // If contract has ended, determine final status
    if (endDate < now) {
      const statusWeights = {
        completed: 0.85,  // 85% completed successfully
        cancelled: 0.10,  // 10% cancelled
        disputed: 0.05    // 5% disputed
      };
      
      const random = Math.random();
      let cumulative = 0;
      
      for (const [status, weight] of Object.entries(statusWeights)) {
        cumulative += weight;
        if (random <= cumulative) {
          return status as any;
        }
      }
    }
    
    // Contract is currently active
    return 'active';
  }

  /**
   * Generate contract milestones from proposal milestones
   */
  private generateContractMilestones(
    proposalMilestones: any[], 
    startDate: Date, 
    contractStatus: string
  ): ContractMilestone[] {
    const milestones: ContractMilestone[] = [];
    const now = new Date();
    
    for (let i = 0; i < proposalMilestones.length; i++) {
      const proposalMilestone = proposalMilestones[i];
      
      // Adjust milestone due date based on contract start date
      const dueDate = new Date(startDate);
      const daysBetweenMilestones = this.calculateDaysBetweenMilestones(proposalMilestones.length, startDate);
      dueDate.setDate(dueDate.getDate() + (daysBetweenMilestones * (i + 1)));
      
      // Determine milestone status
      const milestoneStatus = this.generateMilestoneStatus(dueDate, now, contractStatus, i, proposalMilestones.length);
      
      // Generate completion dates if milestone is completed
      const completedAt = milestoneStatus === 'completed' ? this.generateCompletionDate(dueDate) : undefined;
      const approvedAt = completedAt ? this.generateApprovalDate(completedAt) : undefined;
      
      milestones.push({
        title: proposalMilestone.title,
        description: proposalMilestone.description,
        amount: proposalMilestone.amount,
        dueDate,
        status: milestoneStatus,
        completedAt,
        approvedAt
      });
    }
    
    return milestones;
  }

  /**
   * Calculate days between milestones
   */
  private calculateDaysBetweenMilestones(milestoneCount: number, startDate: Date): number {
    // Distribute milestones evenly across contract duration
    const totalDays = 30; // Default 30 days, can be adjusted based on contract timeline
    return Math.floor(totalDays / milestoneCount);
  }

  /**
   * Generate milestone status based on due date and contract status
   */
  private generateMilestoneStatus(
    dueDate: Date, 
    now: Date, 
    contractStatus: string, 
    milestoneIndex: number, 
    totalMilestones: number
  ): 'pending' | 'in_progress' | 'completed' | 'overdue' {
    
    if (contractStatus === 'completed') {
      return 'completed';
    }
    
    if (contractStatus === 'cancelled' || contractStatus === 'disputed') {
      // Earlier milestones might be completed, later ones pending
      return milestoneIndex < totalMilestones / 2 ? 'completed' : 'pending';
    }
    
    // For active contracts
    if (dueDate > now) {
      // Future milestone
      if (milestoneIndex === 0 || Math.random() > 0.7) {
        return 'in_progress';
      }
      return 'pending';
    } else {
      // Past due date
      if (Math.random() > 0.2) { // 80% chance completed on time
        return 'completed';
      } else {
        return 'overdue';
      }
    }
  }

  /**
   * Generate completion date for completed milestones
   */
  private generateCompletionDate(dueDate: Date): Date {
    const completedAt = new Date(dueDate);
    // Complete 0-3 days before due date (most freelancers deliver early or on time)
    const daysEarly = Math.floor(Math.random() * 4);
    completedAt.setDate(completedAt.getDate() - daysEarly);
    return completedAt;
  }

  /**
   * Generate approval date (1-2 days after completion)
   */
  private generateApprovalDate(completedAt: Date): Date {
    const approvedAt = new Date(completedAt);
    const daysToApprove = Math.floor(Math.random() * 2) + 1; // 1-2 days
    approvedAt.setDate(approvedAt.getDate() + daysToApprove);
    return approvedAt;
  }

  /**
   * Generate contract terms
   */
  private generateContractTerms(proposal: any, freelancer: UserData, client: UserData): string {
    return `Contract Terms and Conditions:

1. SCOPE OF WORK: The freelancer agrees to complete the project "${proposal.project.title}" as outlined in the accepted proposal.

2. PAYMENT TERMS: Total contract value of $${proposal.bidAmount} to be paid according to milestone completion and approval.

3. TIMELINE: Work to be completed within ${proposal.timeline.duration} ${proposal.timeline.unit} from contract start date.

4. DELIVERABLES: All work products, code, designs, and documentation as specified in the project requirements.

5. INTELLECTUAL PROPERTY: All work created under this contract becomes the property of the client upon full payment.

6. CONFIDENTIALITY: Both parties agree to maintain confidentiality of all project-related information.

7. REVISIONS: Reasonable revisions included as per project scope. Additional revisions may incur extra charges.

8. TERMINATION: Either party may terminate this contract with 7 days written notice.

Freelancer: ${freelancer.profile.firstName} ${freelancer.profile.lastName}
Client: ${client.profile.firstName} ${client.profile.lastName}
Contract Date: ${new Date().toLocaleDateString()}`;
  }

  /**
   * Find user by ID (mock implementation)
   */
  private findUserById(users: UserData[], userId: any): UserData | undefined {
    // In real implementation, this would use ObjectId comparison
    return users.find(user => user === userId || user.profile.slug === userId);
  }

  /**
   * Find client for project (mock implementation)
   */
  private findClientForProject(users: UserData[], projectId: any): UserData | undefined {
    // In real implementation, this would look up the project's client
    const clients = users.filter(user => user.role === 'client');
    return clients[Math.floor(Math.random() * clients.length)];
  }

  /**
   * Validate generated contract data
   */
  validate(data: ContractData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const contract = data[i];
      const prefix = `Contract ${i + 1}`;

      // Required fields validation
      if (!contract.proposal) {
        errors.push(`${prefix}: Proposal reference is required`);
      }
      if (!contract.client) {
        errors.push(`${prefix}: Client reference is required`);
      }
      if (!contract.freelancer) {
        errors.push(`${prefix}: Freelancer reference is required`);
      }
      if (!contract.project) {
        errors.push(`${prefix}: Project reference is required`);
      }
      if (!contract.startDate) {
        errors.push(`${prefix}: Start date is required`);
      }
      if (!contract.totalAmount || contract.totalAmount <= 0) {
        errors.push(`${prefix}: Total amount must be positive`);
      }
      if (!contract.milestones || contract.milestones.length === 0) {
        errors.push(`${prefix}: At least one milestone is required`);
      }

      // Business logic validation
      if (contract.endDate && contract.startDate && contract.endDate < contract.startDate) {
        errors.push(`${prefix}: End date cannot be before start date`);
      }

      // Milestone validation
      if (contract.milestones) {
        const totalMilestoneAmount = contract.milestones.reduce((sum, m) => sum + m.amount, 0);
        if (Math.abs(totalMilestoneAmount - contract.totalAmount) > 1) {
          errors.push(`${prefix}: Milestone amounts don't match total contract amount`);
        }

        // Check milestone date consistency
        for (const milestone of contract.milestones) {
          if (milestone.completedAt && milestone.dueDate && milestone.completedAt > milestone.dueDate) {
            if (milestone.status !== 'overdue') {
              warnings.push(`${prefix}: Milestone completed after due date but not marked as overdue`);
            }
          }
          
          if (milestone.approvedAt && milestone.completedAt && milestone.approvedAt < milestone.completedAt) {
            errors.push(`${prefix}: Milestone approval date cannot be before completion date`);
          }
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
   * Get dependencies for contract generation
   */
  getDependencies(): string[] {
    return ['users', 'projects', 'proposals'];
  }
}