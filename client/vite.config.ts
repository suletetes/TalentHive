import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          router: ['react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    isolate: false,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      enabled: false,
    },
    reporters: ['basic'],
    logHeapUsage: false,
    css: false,
  },
});



/**
 * 
 * 
 * est.tsx 2>&1 | grep -E "Test Files|Tests|FAIL|PASS" | head -10
⎯⎯⎯⎯⎯⎯ Failed Tests 13 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  src/test/proposal.test.tsx > ProposalForm > renders proposal form correctly
 FAIL  src/test/proposal.test.tsx > ProposalForm > validates cover letter length
 FAIL  src/test/proposal.test.tsx > ProposalForm > submits proposal successfully
 FAIL  src/test/proposal.test.tsx > ProposalForm > adds and removes milestones
 FAIL  src/test/proposal.test.tsx > ProposalCard > calls action handlers
 FAIL  src/test/proposal.test.tsx > ProposalList > renders proposal list for client
 FAIL  src/test/proposal.test.tsx > ProposalList > renders proposal list for freelancer
 FAIL  src/test/proposal.test.tsx > ProposalList > filters proposals by status
 FAIL  src/test/proposal.test.tsx > ProposalList > searches proposals */ 