/**
 * Data integrity utilities to ensure consistency across the application
 */

import { validateUserReference } from './userHelpers';
import { getProposalBudget } from './proposalHelpers';

export interface DataIntegrityReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedFields: string[];
}

/**
 * Validate and fix contract data integrity
 */
export function validateContractIntegrity(contract: any): DataIntegrityReport {
  const report: DataIntegrityReport = {
    isValid: true,
    errors: [],
    warnings: [],
    fixedFields: [],
  };

  if (!contract) {
    report.isValid = false;
    report.errors.push('Contract data is null or undefined');
    return report;
  }

  // Validate required fields
  const requiredFields = ['_id', 'title', 'client', 'freelancer'];
  for (const field of requiredFields) {
    if (!contract[field]) {
      report.isValid = false;
      report.errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate user references
  if (contract.client && !validateUserReference(contract.client)) {
    report.isValid = false;
    report.errors.push('Invalid client reference');
  }

  if (contract.freelancer && !validateUserReference(contract.freelancer)) {
    report.isValid = false;
    report.errors.push('Invalid freelancer reference');
  }

  // Validate amounts
  if (contract.totalAmount !== undefined) {
    if (typeof contract.totalAmount !== 'number' || contract.totalAmount < 0) {
      report.isValid = false;
      report.errors.push('Invalid totalAmount: must be a positive number');
    }
  }

  // Validate milestones
  if (contract.milestones) {
    if (!Array.isArray(contract.milestones)) {
      report.isValid = false;
      report.errors.push('Milestones must be an array');
    } else {
      let totalMilestoneAmount = 0;
      contract.milestones.forEach((milestone: any, index: number) => {
        if (!milestone._id) {
          report.warnings.push(`Milestone ${index} missing _id`);
        }
        if (!milestone.title) {
          report.warnings.push(`Milestone ${index} missing title`);
        }
        if (typeof milestone.amount === 'number') {
          totalMilestoneAmount += milestone.amount;
        }
      });

      // Check if milestone amounts match total
      if (contract.totalAmount && Math.abs(totalMilestoneAmount - contract.totalAmount) > 0.01) {
        report.warnings.push('Milestone amounts do not match total contract amount');
      }
    }
  }

  // Validate signatures
  if (contract.signatures) {
    if (!Array.isArray(contract.signatures)) {
      report.warnings.push('Signatures should be an array');
    } else {
      contract.signatures.forEach((signature: any, index: number) => {
        if (!signature.signedBy) {
          report.warnings.push(`Signature ${index} missing signedBy field`);
        }
        if (!signature.signedAt) {
          report.warnings.push(`Signature ${index} missing signedAt field`);
        }
      });
    }
  }

  // Fix source type if missing
  if (!contract.sourceType) {
    if (contract.title?.startsWith('Service Request:')) {
      contract.sourceType = 'hire_now';
      report.fixedFields.push('sourceType (set to hire_now for service request)');
    } else if (contract.proposal) {
      contract.sourceType = 'proposal';
      report.fixedFields.push('sourceType (set to proposal)');
    } else {
      contract.sourceType = 'hire_now';
      report.fixedFields.push('sourceType (defaulted to hire_now)');
    }
  }

  return report;
}

/**
 * Validate and fix proposal data integrity
 */
export function validateProposalIntegrity(proposal: any): DataIntegrityReport {
  const report: DataIntegrityReport = {
    isValid: true,
    errors: [],
    warnings: [],
    fixedFields: [],
  };

  if (!proposal) {
    report.isValid = false;
    report.errors.push('Proposal data is null or undefined');
    return report;
  }

  // Validate required fields
  const requiredFields = ['_id', 'project', 'freelancer', 'coverLetter'];
  for (const field of requiredFields) {
    if (!proposal[field]) {
      report.isValid = false;
      report.errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate user reference
  if (proposal.freelancer && !validateUserReference(proposal.freelancer)) {
    report.isValid = false;
    report.errors.push('Invalid freelancer reference');
  }

  // Validate budget information
  const budget = getProposalBudget(proposal);
  if (budget.amount <= 0) {
    report.isValid = false;
    report.errors.push('Proposal must have a valid bid amount');
  }

  // Check for both bidAmount and proposedBudget
  if (!proposal.bidAmount && !proposal.proposedBudget?.amount) {
    report.isValid = false;
    report.errors.push('Proposal missing both bidAmount and proposedBudget.amount');
  }

  // Fix missing bidAmount from proposedBudget
  if (!proposal.bidAmount && proposal.proposedBudget?.amount) {
    proposal.bidAmount = proposal.proposedBudget.amount;
    report.fixedFields.push('bidAmount (copied from proposedBudget.amount)');
  }

  // Validate timeline
  if (proposal.timeline) {
    if (!proposal.timeline.duration || !proposal.timeline.unit) {
      report.warnings.push('Timeline missing duration or unit');
    }
    if (typeof proposal.timeline.duration !== 'number' || proposal.timeline.duration <= 0) {
      report.warnings.push('Timeline duration must be a positive number');
    }
  } else {
    report.warnings.push('Proposal missing timeline information');
  }

  // Validate milestones if present
  if (proposal.milestones && Array.isArray(proposal.milestones)) {
    let totalMilestoneAmount = 0;
    proposal.milestones.forEach((milestone: any, index: number) => {
      if (!milestone.title) {
        report.warnings.push(`Milestone ${index} missing title`);
      }
      if (typeof milestone.amount === 'number') {
        totalMilestoneAmount += milestone.amount;
      }
    });

    // Check if milestone amounts match bid amount
    if (Math.abs(totalMilestoneAmount - budget.amount) > 0.01) {
      report.warnings.push('Milestone amounts do not match bid amount');
    }
  }

  return report;
}

/**
 * Validate and fix project data integrity
 */
export function validateProjectIntegrity(project: any): DataIntegrityReport {
  const report: DataIntegrityReport = {
    isValid: true,
    errors: [],
    warnings: [],
    fixedFields: [],
  };

  if (!project) {
    report.isValid = false;
    report.errors.push('Project data is null or undefined');
    return report;
  }

  // Validate required fields
  const requiredFields = ['_id', 'title', 'description', 'client'];
  for (const field of requiredFields) {
    if (!project[field]) {
      report.isValid = false;
      report.errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate client reference
  if (project.client && !validateUserReference(project.client)) {
    report.isValid = false;
    report.errors.push('Invalid client reference');
  }

  // Validate budget
  if (project.budget) {
    if (typeof project.budget.amount !== 'number' || project.budget.amount <= 0) {
      report.isValid = false;
      report.errors.push('Project budget amount must be a positive number');
    }
    if (!project.budget.type || !['fixed', 'hourly'].includes(project.budget.type)) {
      report.warnings.push('Project budget type should be "fixed" or "hourly"');
    }
  } else {
    report.warnings.push('Project missing budget information');
  }

  // Validate skills
  if (project.skills) {
    if (!Array.isArray(project.skills)) {
      report.warnings.push('Project skills should be an array');
    } else if (project.skills.length === 0) {
      report.warnings.push('Project should have at least one skill requirement');
    }
  }

  // Validate dates
  if (project.deadline) {
    const deadline = new Date(project.deadline);
    if (isNaN(deadline.getTime())) {
      report.warnings.push('Project deadline is not a valid date');
    } else if (deadline < new Date()) {
      report.warnings.push('Project deadline is in the past');
    }
  }

  return report;
}

/**
 * Validate and fix user data integrity
 */
export function validateUserIntegrity(user: any): DataIntegrityReport {
  const report: DataIntegrityReport = {
    isValid: true,
    errors: [],
    warnings: [],
    fixedFields: [],
  };

  if (!user) {
    report.isValid = false;
    report.errors.push('User data is null or undefined');
    return report;
  }

  // Validate required fields
  const requiredFields = ['_id', 'email', 'role'];
  for (const field of requiredFields) {
    if (!user[field]) {
      report.isValid = false;
      report.errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate email format
  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    report.isValid = false;
    report.errors.push('Invalid email format');
  }

  // Validate role
  const validRoles = ['admin', 'client', 'freelancer', 'moderator'];
  if (user.role && !validRoles.includes(user.role)) {
    report.warnings.push(`Unknown user role: ${user.role}`);
  }

  // Validate profile
  if (user.profile) {
    if (!user.profile.firstName) {
      report.warnings.push('User profile missing firstName');
    }
    if (!user.profile.lastName) {
      report.warnings.push('User profile missing lastName');
    }
    
    // Role-specific validations
    if (user.role === 'freelancer') {
      if (!user.profile.bio) {
        report.warnings.push('Freelancer profile missing bio');
      }
      if (!user.profile.skills || !Array.isArray(user.profile.skills) || user.profile.skills.length === 0) {
        report.warnings.push('Freelancer profile missing skills');
      }
      if (!user.profile.hourlyRate || typeof user.profile.hourlyRate !== 'number') {
        report.warnings.push('Freelancer profile missing hourly rate');
      }
    }
  } else {
    report.warnings.push('User missing profile information');
  }

  // Fix missing roles array
  if (!user.roles || !Array.isArray(user.roles)) {
    user.roles = [user.role];
    report.fixedFields.push('roles (created from role field)');
  }

  return report;
}

/**
 * Batch validate multiple data items
 */
export function batchValidateData<T>(
  items: T[],
  validator: (item: T) => DataIntegrityReport,
  itemType: string
): {
  totalItems: number;
  validItems: number;
  invalidItems: number;
  totalErrors: number;
  totalWarnings: number;
  totalFixedFields: number;
  reports: DataIntegrityReport[];
} {
  const reports = items.map(validator);
  
  return {
    totalItems: items.length,
    validItems: reports.filter(r => r.isValid).length,
    invalidItems: reports.filter(r => !r.isValid).length,
    totalErrors: reports.reduce((sum, r) => sum + r.errors.length, 0),
    totalWarnings: reports.reduce((sum, r) => sum + r.warnings.length, 0),
    totalFixedFields: reports.reduce((sum, r) => sum + r.fixedFields.length, 0),
    reports,
  };
}

/**
 * Log data integrity report
 */
export function logIntegrityReport(report: DataIntegrityReport, itemType: string, itemId?: string): void {
  const prefix = `[DATA INTEGRITY] ${itemType}${itemId ? ` ${itemId}` : ''}`;
  
  if (report.isValid) {
    console.log(`${prefix}:  Valid`);
  } else {
    console.warn(`${prefix}:  Invalid`);
  }
  
  if (report.errors.length > 0) {
    console.error(`${prefix} Errors:`, report.errors);
  }
  
  if (report.warnings.length > 0) {
    console.warn(`${prefix} Warnings:`, report.warnings);
  }
  
  if (report.fixedFields.length > 0) {
    console.log(`${prefix} Fixed:`, report.fixedFields);
  }
}

/**
 * Auto-fix common data integrity issues
 */
export function autoFixDataIntegrity<T>(
  item: T,
  validator: (item: T) => DataIntegrityReport
): { fixed: T; report: DataIntegrityReport } {
  const report = validator(item);
  
  // The validator functions already perform auto-fixes by modifying the item
  // This function serves as a wrapper to make the auto-fix behavior explicit
  
  return { fixed: item, report };
}