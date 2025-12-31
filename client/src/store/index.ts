import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
import { 
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import supportTicketReducer from './slices/supportTicketSlice';
import onboardingReducer from './slices/onboardingSlice';
import { rootPersistConfig, authPersistConfig, uiPersistConfig } from './persistConfig';

// Create persisted reducers with individual configurations
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);

const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  ui: persistedUiReducer,
  user: userReducer, // Not persisted - temporary session data
  supportTicket: supportTicketReducer, // Not persisted - temporary data
  onboarding: onboardingReducer, // Not persisted - temporary flow data
});

// Apply root persist configuration
const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt'],
      },
      // Enable immutability and serializability checks in development
      immutableCheck: {
        warnAfter: 128, // Warn if immutability check takes longer than 128ms
      },
    }),
  devTools: import.meta.env.VITE_NODE_ENV !== 'production' && {
    // Enhanced Redux DevTools configuration
    name: 'TalentHive',
    trace: true,
    traceLimit: 25,
  },
});

export const persistor = persistStore(store, {
  // Enhanced persistor configuration
  manualPersist: false,
  // Debug logging in development
  debug: import.meta.env.VITE_NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export persist utilities
export { clearPersistedState, checkMigrationNeeded } from './persistConfig';