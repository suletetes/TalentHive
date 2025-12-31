// Comprehensive cache management utility for React Query
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryClient';

export class CacheManager {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Invalidate all related queries when a project changes
   */
  invalidateProjectRelated(projectId?: string) {
    // Invalidate project queries
    this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    
    if (projectId) {
      // Invalidate specific project
      this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      
      // Invalidate related proposals
      this.queryClient.invalidateQueries({ queryKey: queryKeys.proposals.byProject(projectId) });
      
      // Invalidate project contracts
      this.queryClient.invalidateQueries({ 
        queryKey: queryKeys.contracts.all,
        predicate: (query) => {
          const data = query.state.data as any;
          return data?.some?.((contract: any) => contract.project === projectId || contract.project?._id === projectId);
        }
      });
    }
    
    // Invalidate user stats (project counts may have changed)
    this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
  }

  /**
   * Invalidate all related queries when a proposal changes
   */
  invalidateProposalRelated(proposalId?: string, projectId?: string) {
    // Invalidate proposal queries
    this.queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
    
    if (proposalId) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.proposals.detail(proposalId) });
    }
    
    if (projectId) {
      // Invalidate project proposals
      this.queryClient.invalidateQueries({ queryKey: queryKeys.proposals.byProject(projectId) });
      
      // Invalidate project details (proposal count may have changed)
      this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    }
    
    // Invalidate user stats
    this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
  }

  /**
   * Invalidate all related queries when a contract changes
   */
  invalidateContractRelated(contractId?: string, projectId?: string, freelancerId?: string, clientId?: string) {
    // Invalidate contract queries
    this.queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    
    if (contractId) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(contractId) });
    }
    
    // Invalidate related payments
    this.queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    
    if (projectId) {
      // Invalidate project details
      this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    }
    
    // Invalidate user stats for both freelancer and client
    if (freelancerId || clientId) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
    }
  }

  /**
   * Invalidate all related queries when a payment changes
   */
  invalidatePaymentRelated(transactionId?: string, contractId?: string) {
    // Invalidate payment queries
    this.queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    
    if (transactionId) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(transactionId) });
    }
    
    if (contractId) {
      // Invalidate contract details (payment status may have changed)
      this.queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(contractId) });
    }
    
    // Invalidate user balance and stats
    this.queryClient.invalidateQueries({ queryKey: queryKeys.payments.history() });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
  }

  /**
   * Invalidate all related queries when a message is sent/received
   */
  invalidateMessageRelated(conversationId?: string) {
    // Invalidate message queries
    this.queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    
    if (conversationId) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversation(conversationId) });
    }
    
    // Invalidate unread counts
    this.queryClient.invalidateQueries({ queryKey: queryKeys.messages.unread() });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
  }

  /**
   * Invalidate all related queries when a notification changes
   */
  invalidateNotificationRelated() {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
  }

  /**
   * Invalidate all related queries when user profile changes
   */
  invalidateUserRelated(userId?: string) {
    if (userId) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(userId) });
    }
    
    // Invalidate current user data
    this.queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
    
    // Invalidate reviews (profile changes may affect ratings)
    this.queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
  }

  /**
   * Smart cache invalidation based on entity type and relationships
   */
  invalidateRelated(entityType: string, entityId?: string, relatedData?: Record<string, any>) {
    switch (entityType) {
      case 'project':
        this.invalidateProjectRelated(entityId);
        break;
      
      case 'proposal':
        this.invalidateProposalRelated(entityId, relatedData?.projectId);
        break;
      
      case 'contract':
        this.invalidateContractRelated(
          entityId, 
          relatedData?.projectId, 
          relatedData?.freelancerId, 
          relatedData?.clientId
        );
        break;
      
      case 'payment':
        this.invalidatePaymentRelated(entityId, relatedData?.contractId);
        break;
      
      case 'message':
        this.invalidateMessageRelated(relatedData?.conversationId);
        break;
      
      case 'notification':
        this.invalidateNotificationRelated();
        break;
      
      case 'user':
        this.invalidateUserRelated(entityId);
        break;
      
      default:
        console.warn(`[CacheManager] Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Clear all cache data (for logout or major state changes)
   */
  clearAll() {
    this.queryClient.clear();
    console.log('[CacheManager] All cache data cleared');
  }

  /**
   * Remove stale data older than specified time
   */
  removeStaleData(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours default
    const now = Date.now();
    
    this.queryClient.getQueryCache().getAll().forEach(query => {
      const lastUpdated = query.state.dataUpdatedAt;
      if (lastUpdated && (now - lastUpdated) > maxAge) {
        this.queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
    
    console.log(`[CacheManager] Removed stale data older than ${maxAge}ms`);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: this.estimateCacheSize(queries),
    };
    
    console.log('[CacheManager] Cache Statistics:', stats);
    return stats;
  }

  /**
   * Estimate cache size in bytes (rough approximation)
   */
  private estimateCacheSize(queries: any[]): number {
    let totalSize = 0;
    
    queries.forEach(query => {
      if (query.state.data) {
        try {
          totalSize += JSON.stringify(query.state.data).length * 2; // Rough UTF-16 estimation
        } catch (error) {
          // Skip queries with non-serializable data
        }
      }
    });
    
    return totalSize;
  }
}

// Create singleton instance
let cacheManagerInstance: CacheManager | null = null;

export const getCacheManager = (queryClient: QueryClient): CacheManager => {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(queryClient);
  }
  return cacheManagerInstance;
};

// Hook to use cache manager
export const useCacheManager = () => {
  const queryClient = new QueryClient(); // This should be injected from context
  return getCacheManager(queryClient);
};