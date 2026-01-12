import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { splitVendorChunkPlugin } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  const isAnalyze = env.ANALYZE === 'true';

  return {
    plugins: [
      react({
        // Enable React Fast Refresh only in development
        fastRefresh: isDevelopment,
        // Optimize React imports
        jsxImportSource: '@emotion/react',
      }),
      // Split vendor chunks automatically
      splitVendorChunkPlugin(),
      // Bundle analyzer (only when explicitly requested)
      isAnalyze && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'treemap', 'sunburst', 'network'
      }),
    ].filter(Boolean),
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    // Development server configuration
    server: isDevelopment ? {
      port: 3000,
      host: true, // Allow external connections
      open: false, // Don't auto-open browser
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    } : undefined,
    
    // Preview server configuration (for production builds)
    preview: {
      port: 3000,
      host: true,
      cors: true,
    },
    
    build: {
      outDir: 'dist',
      // Source maps: only in development or when explicitly enabled
      sourcemap: isDevelopment || env.GENERATE_SOURCEMAP === 'true',
      // Minification: different strategies for dev/prod
      minify: isProduction ? 'esbuild' : false,
      // Target: modern browsers in production, broader support in development
      target: isProduction ? 'es2020' : 'esnext',
      // Chunk size warning limit
      chunkSizeWarningLimit: isProduction ? 500 : 1000,
      // Report compressed size only in production
      reportCompressedSize: isProduction,
      
      // ESBuild options for production
      ...(isProduction && {
        esbuild: {
          drop: ['console', 'debugger'],
          legalComments: 'none',
        },
      }),
      
      rollupOptions: {
        output: {
          // Advanced manual chunking strategy
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              
              // Material-UI
              if (id.includes('@mui') || id.includes('@emotion')) {
                return 'mui-vendor';
              }
              
              // Routing
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
              
              // State management
              if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('redux-persist')) {
                return 'redux-vendor';
              }
              
              // Data fetching
              if (id.includes('@tanstack') || id.includes('axios')) {
                return 'query-vendor';
              }
              
              // Form handling
              if (id.includes('formik') || id.includes('yup')) {
                return 'form-vendor';
              }
              
              // Utilities
              if (id.includes('date-fns') || id.includes('lodash')) {
                return 'utils-vendor';
              }
              
              // Socket.io
              if (id.includes('socket.io')) {
                return 'socket-vendor';
              }
              
              // Other vendor libraries
              return 'vendor';
            }
            
            // App chunks (only in production for better caching)
            if (isProduction) {
              if (id.includes('/src/pages/')) {
                return 'pages';
              }
              
              if (id.includes('/src/components/')) {
                return 'components';
              }
              
              if (id.includes('/src/services/')) {
                return 'services';
              }
              
              if (id.includes('/src/utils/')) {
                return 'utils';
              }
              
              if (id.includes('/src/hooks/')) {
                return 'hooks';
              }
            }
          },
          
          // Optimize chunk and asset names for production
          chunkFileNames: isProduction 
            ? 'js/[name]-[hash].js'
            : 'js/[name].js',
          entryFileNames: isProduction 
            ? 'js/[name]-[hash].js'
            : 'js/[name].js',
          assetFileNames: (assetInfo) => {
            if (!isProduction) return '[name].[ext]';
            
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `images/[name]-[hash].${ext}`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `fonts/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },
        
        // External dependencies (only in production if using CDN)
        external: isProduction && env.USE_CDN === 'true' ? [
          // Add CDN dependencies here if needed
        ] : [],
      },
      
      // CSS optimization
      cssCodeSplit: isProduction,
      cssMinify: isProduction,
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@mui/material',
        '@mui/icons-material',
        'react-router-dom',
        '@reduxjs/toolkit',
        'react-redux',
        '@tanstack/react-query',
        'axios',
        'formik',
        'yup',
      ],
      exclude: [
        // Exclude large dependencies that should be lazy loaded
      ],
    },
    
    // Environment-specific defines
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
      // Note: console.log removal is handled by minification in production
    },
    
    // Test configuration
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
  };
});