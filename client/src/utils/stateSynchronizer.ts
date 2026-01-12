// State synchronization utility to manage Redux and React Query conflicts
import { QueryClient } from '@tanstack/react-query';
import { Store } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { updateUser } from '@/store/slices/authSlice';
import { queryKeys } from '@/config/queryClient';

export class StateSynchronizer {
  private queryClient: QueryClient;
  private store: Store<RootState>;
  private syncInProgress = false;

  constructor(queryClient: QueryClient, store: Store<RootState>) {
    this.queryClient = queryClient;
    this.store = store;
  }

  /**
   * Synchronize user data between Redux auth state and React Query cache
   */
  syncUserData() {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const authState = this.store.getState().auth;
      const userProfileQuery = this.queryClient.getQueryData(queryKeys.auth.user());

      // If React Query has newer user data, update Redux
      if (userProfileQuery && authState.user) {
        const profileData = this.extractUserData(userProfileQuery);
        
        if (profileData && this.isNewerData(profileData, authState.user)) {
          console.log('[StateSynchronizer] Updating Redux with newer React Query user data');
          this.store.dispatch(updateUser(profileData));
        }
      }

      // If Redux has user data but React Query doesn't, seed the cache
      if (authState.user && !userProfileQuery) {
        console.log('[StateSynchronizer] Seeding React Query cache with Redux user data');
        this.queryClient.setQueryData(queryKeys.auth.user(), {
          status: 'success',
          data: { user: authState.user },
        });
      }
    } catch (error) {
      console.error('[StateSynchronizer] Error syncing user data:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Extract user data from various response formats
   */
  private extractUserData(queryData: any): any {
    // Handle different response formats
    if (queryData?.data?.user) {
      return queryData.data.user;
    }
    if (queryData?.user) {
      return queryData.user;
    }
    if (queryData?.data && !queryData.data.user) {
      return queryData.data;
    }
    return queryData;
  }

  /**
   * Check if data is newer based on updatedAt timestamp
   */
  private isNewerData(newData: any, currentData: any): boolean {
    if (!newData.updatedAt || !currentData.updatedAt) {
      return false;
    }

    const newTimestamp = new Date(newData.updatedAt).getTime();
    const currentTimestamp = new Date(currentData.updatedAt).getTime();
    
    return newTimestamp > currentTimestamp;
  }

  /**
   * Clear React Query cache when user logs out
   */
  clearCacheOnLogout() {
    console.log('[StateSynchronizer] Clearing React Query cache on logout');
    
    // Clear user-specific data
    this.queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    this.queryClient.removeQueries({ queryKey: queryKeys.projects.my() });
    this.queryClient.removeQueries({ queryKey: queryKeys.proposals.my() });
    this.queryClient.removeQueries({ queryKey: queryKeys.contracts.my() });
    this.queryClient.removeQueries({ queryKey: queryKeys.messages.all });
    this.queryClient.removeQueries({ queryKey: queryKeys.notifications.all });
    
    // Keep public data (projects, freelancers) but mark as stale
    this.queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
  }

  /**
   * Sync authentication state changes
   */
  syncAuthState() {
    const authState = this.store.getState().auth;
    
    if (!authState.isAuthenticated) {
      this.clearCacheOnLogout();
    } else {
      this.syncUserData();
    }
  }

  /**
   * Handle optimistic updates conflicts
   */
  resolveOptimisticUpdateConflict(queryKey: any[], serverData: any, optimisticData: any) {
    console.log('[StateSynchronizer] Resolving optimistic update conflict');
    
    // Server data always wins
    this.queryClient.setQueryData(queryKey, serverData);
    
    // Log the conflict for debugging
    console.warn('[StateSynchronizer] Optimistic update conflict resolved:', {
      queryKey,
      optimisticData,
      serverData,
    });
  }

  /**
   * Setup automatic synchronization listeners
   */
  setupAutoSync() {
    // Listen to Redux store changes
    this.store.subscribe(() => {
      const currentState = this.store.getState();
      
      // Sync when auth state changes
      if (currentState.auth.isAuthenticated) {
        this.syncUserData();
      }
    });

    // Listen to React Query cache changes for user data
    this.queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'auth' && event?.query?.queryKey?.[1] === 'user') {
        if (event.type === 'updated' && event.query.state.status === 'success') {
          this.syncUserData();
        }
      }
    });

    console.log('[StateSynchronizer] Auto-sync listeners setup complete');
  }

  /**
   * Manual sync trigger for specific scenarios
   */
  forcSync() {
    console.log('[StateSynchronizer] Force syncing all state');
    this.syncUserData();
    this.syncAuthState();
  }

  /**
   * Get synchronization status for debugging
   */
  getSyncStatus() {
    const authState = this.store.getState().auth;
    const userQuery = this.queryClient.getQueryData(queryKeys.auth.user());
    
    return {
      reduxHasUser: !!authState.user,
      reactQueryHasUser: !!userQuery,
      syncInProgress: this.syncInProgress,
      isAuthenticated: authState.isAuthenticated,
      lastSyncTime: new Date().toISOString(),
    };
  }
}

// Singleton instance
let synchronizerInstance: StateSynchronizer | null = null;

export const getStateSynchronizer = (queryClient: QueryClient, store: Store<RootState>): StateSynchronizer => {
  if (!synchronizerInstance) {
    synchronizerInstance = new StateSynchronizer(queryClient, store);
    synchronizerInstance.setupAutoSync();
  }
  return synchronizerInstance;
};

// Hook to use state synchronizer
export const useStateSynchronizer = () => {
  // This would need to be properly injected with context
  return synchronizerInstance;
};