import mongoose from 'mongoose';
import { User } from '@/models/User';
import { Contract } from '@/models/Contract';
import { Review } from '@/models/Review';
import { Project } from '@/models/Project';
import { Proposal } from '@/models/Proposal';
import { Payment } from '@/models/Payment';

export interface ConsistencyIssue {
  type: 'rating_mismatch' | 'contract_amount' | 'missing_reference' | 'orphaned_record' | 'review_count_mismatch';
  severity: 'critical' | 'warning' | 'info';
  entity: string;
  entityId: mongoose.Types.ObjectId;
  description: string;
  expectedValue?: any;
  actualValue?: any;
  canAutoFix: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ConsistencyIssue[];
}

export interface ConsistencyReport {
  timestamp: Date;
  totalChecked: number;
  issuesFound: number;
  issues: ConsistencyIssue[];
}

export interface FixDetail {
  issue: ConsistencyIssue;
  fixed: boolean;
  error?: string;
}

export interface FixReport {
  timestamp: Date;
  issuesFixed: number;
  issuesFailed: number;
  details: FixDetail[];
}

export class DataConsistencyService {
  /**
   * Synchronize user rating based on published reviews
   */
  async syncUserRating(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      // Get all published reviews for this user
      const reviews = await Review.find({
        reviewee: userId,
        status: 'published'
      });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate average rating
      if (reviews.length === 0) {
        user.rating.average = 0;
        user.rating.count = 0;
      } else {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        user.rating.average = totalRating / reviews.length;
        user.rating.count = reviews.length;
      }

      await user.save();
    } catch (error) {
      console.error('Error syncing user rating:', error);
      throw error;
    }
  }

  /**
   * Synchronize all user ratings
   */
  async syncAllRatings(): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    let totalChecked = 0;

    try {
      const users = await User.find({});
      
      for (const user of users) {
        totalChecked++;
        
        const reviews = await Review.find({
          reviewee: user._id,
          status: 'published'
        });

        const expectedCount = reviews.length;
        const expectedAverage = expectedCount === 0 
          ? 0 
          : reviews.reduce((sum, r) => sum + r.rating, 0) / expectedCount;

        // Check for mismatches
        if (Math.abs(user.rating.average - expectedAverage) > 0.01 || user.rating.count !== expectedCount) {
          issues.push({
            type: 'rating_mismatch',
            severity: 'warning',
            entity: 'User',
            entityId: user._id as any,
            description: `User rating mismatch: expected ${expectedAverage.toFixed(2)} (${expectedCount} reviews), got ${user.rating.average.toFixed(2)} (${user.rating.count} reviews)`,
            expectedValue: { average: expectedAverage, count: expectedCount },
            actualValue: { average: user.rating.average, count: user.rating.count },
            canAutoFix: true
          });
        }
      }

      return {
        timestamp: new Date(),
        totalChecked,
        issuesFound: issues.length,
        issues
      };
    } catch (error) {
      console.error('Error syncing all ratings:', error);
      throw error;
    }
  }

  /**
   * Validate contract milestone amounts sum to total
   */
  async validateContractAmounts(contractId: mongoose.Types.ObjectId): Promise<ValidationResult> {
    const issues: ConsistencyIssue[] = [];

    try {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return { isValid: false, issues: [{ 
          type: 'missing_reference',
          severity: 'critical',
          entity: 'Contract',
          entityId: contractId,
          description: 'Contract not found',
          canAutoFix: false
        }]};
      }

      if (contract.milestones && contract.milestones.length > 0) {
        const totalMilestoneAmount = contract.milestones.reduce(
          (sum: number, milestone: any) => sum + (milestone.amount || 0),
          0
        );

        const difference = Math.abs(totalMilestoneAmount - contract.totalAmount);
        
        if (difference > 0.01) {
          issues.push({
            type: 'contract_amount',
            severity: 'critical',
            entity: 'Contract',
            entityId: contract._id as any,
            description: `Contract milestone amounts (${totalMilestoneAmount}) do not sum to total amount (${contract.totalAmount})`,
            expectedValue: contract.totalAmount,
            actualValue: totalMilestoneAmount,
            canAutoFix: false // Cannot auto-fix as we don't know which value is correct
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Error validating contract amounts:', error);
      throw error;
    }
  }

  /**
   * Validate all contracts
   */
  async validateAllContracts(): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    let totalChecked = 0;

    try {
      const contracts = await Contract.find({});
      
      for (const contract of contracts) {
        totalChecked++;
        const result = await this.validateContractAmounts(contract._id as any);
        issues.push(...result.issues);
      }

      return {
        timestamp: new Date(),
        totalChecked,
        issuesFound: issues.length,
        issues
      };
    } catch (error) {
      console.error('Error validating all contracts:', error);
      throw error;
    }
  }

  /**
   * Validate project references (contract, proposal, client, freelancer)
   */
  async validateProjectReferences(projectId: mongoose.Types.ObjectId): Promise<ValidationResult> {
    const issues: ConsistencyIssue[] = [];

    try {
      const project = await Project.findById(projectId)
        .populate('client')
        .populate('selectedFreelancer');

      if (!project) {
        return { isValid: false, issues: [{
          type: 'missing_reference',
          severity: 'critical',
          entity: 'Project',
          entityId: projectId,
          description: 'Project not found',
          canAutoFix: false
        }]};
      }

      // Check client exists
      if (!project.client) {
        issues.push({
          type: 'missing_reference',
          severity: 'critical',
          entity: 'Project',
          entityId: project._id as any,
          description: 'Project client reference is missing',
          canAutoFix: false
        });
      }

      // Check contracts for this project
      const contracts = await Contract.find({ project: projectId });
      
      for (const contract of contracts) {
        // Verify contract references valid entities
        const [client, freelancer, proposal] = await Promise.all([
          User.findById(contract.client),
          User.findById(contract.freelancer),
          Proposal.findById(contract.proposal)
        ]);

        if (!client) {
          issues.push({
            type: 'missing_reference',
            severity: 'critical',
            entity: 'Contract',
            entityId: contract._id as any,
            description: 'Contract client reference is invalid',
            canAutoFix: false
          });
        }

        if (!freelancer) {
          issues.push({
            type: 'missing_reference',
            severity: 'critical',
            entity: 'Contract',
            entityId: contract._id as any,
            description: 'Contract freelancer reference is invalid',
            canAutoFix: false
          });
        }

        if (!proposal) {
          issues.push({
            type: 'missing_reference',
            severity: 'critical',
            entity: 'Contract',
            entityId: contract._id as any,
            description: 'Contract proposal reference is invalid',
            canAutoFix: false
          });
        } else {
          // Verify proposal is for this project
          if (proposal.project.toString() !== projectId.toString()) {
            issues.push({
              type: 'missing_reference',
              severity: 'critical',
              entity: 'Contract',
              entityId: contract._id as any,
              description: 'Contract proposal does not belong to this project',
              canAutoFix: false
            });
          }

          // Verify proposal is by the freelancer
          if (proposal.freelancer.toString() !== contract.freelancer.toString()) {
            issues.push({
              type: 'missing_reference',
              severity: 'critical',
              entity: 'Contract',
              entityId: contract._id as any,
              description: 'Contract freelancer does not match proposal freelancer',
              canAutoFix: false
            });
          }
        }

        // Verify client owns project
        if (client && contract.client.toString() !== (project.client as any)._id.toString()) {
          issues.push({
            type: 'missing_reference',
            severity: 'warning',
            entity: 'Contract',
            entityId: contract._id as any,
            description: 'Contract client does not match project client',
            canAutoFix: false
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Error validating project references:', error);
      throw error;
    }
  }

  /**
   * Validate all references
   */
  async validateAllReferences(): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    let totalChecked = 0;

    try {
      const projects = await Project.find({});
      
      for (const project of projects) {
        totalChecked++;
        const result = await this.validateProjectReferences(project._id as any);
        issues.push(...result.issues);
      }

      return {
        timestamp: new Date(),
        totalChecked,
        issuesFound: issues.length,
        issues
      };
    } catch (error) {
      console.error('Error validating all references:', error);
      throw error;
    }
  }

  /**
   * Synchronize review count for a user
   */
  async syncReviewCount(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const reviewCount = await Review.countDocuments({
        reviewee: userId,
        status: 'published'
      });

      await User.findByIdAndUpdate(userId, {
        'rating.count': reviewCount
      });
    } catch (error) {
      console.error('Error syncing review count:', error);
      throw error;
    }
  }

  /**
   * Run full consistency check
   */
  async runFullConsistencyCheck(): Promise<ConsistencyReport> {
    try {
      const [ratingsReport, contractsReport, referencesReport] = await Promise.all([
        this.syncAllRatings(),
        this.validateAllContracts(),
        this.validateAllReferences()
      ]);

      const allIssues = [
        ...ratingsReport.issues,
        ...contractsReport.issues,
        ...referencesReport.issues
      ];

      return {
        timestamp: new Date(),
        totalChecked: ratingsReport.totalChecked + contractsReport.totalChecked + referencesReport.totalChecked,
        issuesFound: allIssues.length,
        issues: allIssues
      };
    } catch (error) {
      console.error('Error running full consistency check:', error);
      throw error;
    }
  }

  /**
   * Fix inconsistencies automatically where possible
   */
  async fixInconsistencies(report: ConsistencyReport, autoFix: boolean = false): Promise<FixReport> {
    const details: FixDetail[] = [];
    let issuesFixed = 0;
    let issuesFailed = 0;

    for (const issue of report.issues) {
      if (!issue.canAutoFix) {
        details.push({
          issue,
          fixed: false,
          error: 'Cannot auto-fix this issue'
        });
        issuesFailed++;
        continue;
      }

      if (!autoFix) {
        details.push({
          issue,
          fixed: false,
          error: 'Auto-fix not enabled'
        });
        issuesFailed++;
        continue;
      }

      try {
        // Fix based on issue type
        if (issue.type === 'rating_mismatch') {
          await this.syncUserRating(issue.entityId);
          details.push({ issue, fixed: true });
          issuesFixed++;
        } else if (issue.type === 'review_count_mismatch') {
          await this.syncReviewCount(issue.entityId);
          details.push({ issue, fixed: true });
          issuesFixed++;
        } else {
          details.push({
            issue,
            fixed: false,
            error: 'No auto-fix handler for this issue type'
          });
          issuesFailed++;
        }
      } catch (error: any) {
        details.push({
          issue,
          fixed: false,
          error: error.message
        });
        issuesFailed++;
      }
    }

    return {
      timestamp: new Date(),
      issuesFixed,
      issuesFailed,
      details
    };
  }
}

// Export singleton instance
export const dataConsistencyService = new DataConsistencyService();
