import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import supportTicketReducer from './slices/supportTicketSlice';
import onboardingReducer from './slices/onboardingSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Persist auth and UI state (including theme)
};

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  user: userReducer,
  supportTicket: supportTicketReducer,
  onboarding: onboardingReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.VITE_NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;