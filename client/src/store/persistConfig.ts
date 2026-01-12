// Redux Persist Configuration with migrations and serialization
import storage from 'redux-persist/lib/storage';
import { PersistConfig } from 'redux-persist';
import { AuthState } from '@/types/auth';

// Current version of the persisted state schema
const CURRENT_VERSION = 1;

// State migrations for schema changes
const migrations = {
  // Migration from version 0 to 1
  1: (state: any) => {
    // Example migration: rename old field names
    if (state.auth && state.auth.user) {
      // Ensure _id field exists for backward compatibility
      if (state.auth.user.id && !state.auth.user._id) {
        state.auth.user._id = state.auth.user.id;
      }
    }
    return state;
  },
};

// Custom serialization for complex objects
const transforms = [
  // Transform for Date objects
  {
    in: (inboundState: any, key: string) => {
      // Convert Date strings back to Date objects if needed
      if (key === 'auth' && inboundState?.user?.createdAt) {
        return {
          ...inboundState,
          user: {
            ...inboundState.user,
            createdAt: new Date(inboundState.user.createdAt),
            updatedAt: new Date(inboundState.user.updatedAt),
          },
        };
      }
      return inboundState;
    },
    out: (outboundState: any, key: string) => {
      // Convert Date objects to strings for storage
      if (key === 'auth' && outboundState?.user?.createdAt) {
        return {
          ...outboundState,
          user: {
            ...outboundState.user,
            createdAt: outboundState.user.createdAt.toISOString(),
            updatedAt: outboundState.user.updatedAt.toISOString(),
          },
        };
      }
      return outboundState;
    },
  },
];

// Auth slice persist configuration
export const authPersistConfig: PersistConfig<AuthState> = {
  key: 'auth',
  storage,
  version: CURRENT_VERSION,
  migrate: (state: any) => {
    let migratedState = state;
    const persistedVersion = state?._persist?.version || 0;
    
    // Apply migrations sequentially
    for (let version = persistedVersion + 1; version <= CURRENT_VERSION; version++) {
      if (migrations[version as keyof typeof migrations]) {
        migratedState = migrations[version as keyof typeof migrations](migratedState);
      }
    }
    
    return Promise.resolve(migratedState);
  },
  // Only persist essential auth data
  whitelist: ['user', 'token', 'refreshToken', 'isAuthenticated'],
  // Don't persist loading states
  blacklist: ['isLoading'],
};

// UI slice persist configuration
export const uiPersistConfig = {
  key: 'ui',
  storage,
  version: CURRENT_VERSION,
  // Persist all UI preferences
  whitelist: ['theme', 'sidebarOpen'],
};

// Root persist configuration
export const rootPersistConfig = {
  key: 'talenthive-root',
  storage,
  version: CURRENT_VERSION,
  // Only persist specific slices
  whitelist: ['auth', 'ui'],
  // Don't persist temporary data
  blacklist: ['user', 'supportTicket', 'onboarding'],
  migrate: async (state: any) => {
    try {
      let migratedState = state;
      const persistedVersion = state?._persist?.version || 0;
      
      console.log(`[Redux Persist] Migrating from version ${persistedVersion} to ${CURRENT_VERSION}`);
      
      // Apply migrations sequentially
      for (let version = persistedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version as keyof typeof migrations]) {
          console.log(`[Redux Persist] Applying migration ${version}`);
          migratedState = migrations[version as keyof typeof migrations](migratedState);
        }
      }
      
      console.log('[Redux Persist] Migration completed successfully');
      return migratedState;
    } catch (error) {
      console.error('[Redux Persist] Migration failed:', error);
      // Return undefined to trigger a fresh state
      return undefined;
    }
  },
  // Throttle writes to storage (debounce rapid state changes)
  throttle: 1000,
  // Serialize/deserialize functions
  serialize: (data: any) => {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('[Redux Persist] Serialization failed:', error);
      return '{}';
    }
  },
  deserialize: (data: string) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('[Redux Persist] Deserialization failed:', error);
      return {};
    }
  },
};

// Utility to clear persisted state (for logout or reset)
export const clearPersistedState = async () => {
  try {
    await storage.removeItem('persist:talenthive-root');
    await storage.removeItem('persist:auth');
    await storage.removeItem('persist:ui');
    console.log('[Redux Persist] Persisted state cleared');
  } catch (error) {
    console.error('[Redux Persist] Failed to clear persisted state:', error);
  }
};

// Utility to check if state needs migration
export const checkMigrationNeeded = async (): Promise<boolean> => {
  try {
    const persistedState = await storage.getItem('persist:talenthive-root');
    if (!persistedState) return false;
    
    const parsed = JSON.parse(persistedState);
    const persistedVersion = parsed._persist?.version || 0;
    
    return persistedVersion < CURRENT_VERSION;
  } catch (error) {
    console.error('[Redux Persist] Failed to check migration status:', error);
    return false;
  }
};