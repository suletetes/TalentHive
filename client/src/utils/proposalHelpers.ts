/**
 * Utility functions for handling proposal data with backward compatibility
 */

export interface ProposalBudgetInfo {
  amount: number;
  type: 'hourly' | 'fixed';
}

/**
 * Extract budget information from proposal with fallback support
 * Prioritizes bidAmount field over legacy proposedBudget.amount
 */
export function getProposalBudget(proposal: any): ProposalBudgetInfo {
  // Primary: Use bidAmount if available
  if (proposal.bidAmount !== undefined && proposal.bidAmount !== null) {
    return {
      amount: proposal.bidAmount,
      type: proposal.proposedBudget?.type || 'fixed', // Default to fixed if type not specified
    };
  }
  
  // Fallback: Use legacy proposedBudget structure
  if (proposal.proposedBudget?.amount !== undefined) {
    return {
      amount: proposal.proposedBudget.amount,
      type: proposal.proposedBudget.type || 'fixed',
    };
  }
  
  // Default fallback
  return {
    amount: 0,
    type: 'fixed',
  };
}

/**
 * Format budget amount with appropriate suffix
 */
export function formatProposalBudget(proposal: any): string {
  const budget = getProposalBudget(proposal);
  const suffix = budget.type === 'hourly' ? '/hour' : '';
  return `$${budget.amount}${suffix}`;
}

/**
 * Get budget type display text
 */
export function getBudgetTypeDisplay(proposal: any): string {
  const budget = getProposalBudget(proposal);
  return budget.type === 'hourly' ? '/hour' : 'fixed';
}