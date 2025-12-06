import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { store, persistor, RootState } from '@/store';
import { createAppTheme } from '@/theme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createQueryClient } from '@/config/queryClient';

// Create a client for React Query with optimized configuration
const queryClient = createQueryClient();

// Theme wrapper component to access Redux state
const ThemedApp = () => {
  const themeMode = useSelector((state: RootState) => state.ui.theme);
  const theme = React.useMemo(() => createAppTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: themeMode === 'dark' ? '#1e293b' : '#363636',
            color: '#fff',
          },
        }}
      />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemedApp />
          </BrowserRouter>
          {import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);