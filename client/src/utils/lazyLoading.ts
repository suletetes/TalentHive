// Lazy loading utilities for code splitting and performance optimization
import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Enhanced lazy loading with error boundary and retry logic
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    retries?: number;
    retryDelay?: number;
    fallback?: ComponentType;
  } = {}
): LazyExoticComponent<T> => {
  const { retries = 3, retryDelay = 1000 } = options;

  const lazyImport = () => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempt = 0;

      const tryImport = async () => {
        try {
          const module = await importFn();
          resolve(module);
        } catch (error) {
          attempt++;
          
          // Create a serializable error message
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (attempt < retries) {
            console.warn(`[LazyLoading] Import failed, retrying (${attempt}/${retries}):`, errorMessage);
            setTimeout(tryImport, retryDelay * attempt);
          } else {
            console.error('[LazyLoading] Import failed after all retries:', errorMessage);
            // Create a clean error object that can be serialized
            const cleanError = new Error(`Failed to load component after ${retries} attempts: ${errorMessage}`);
            reject(cleanError);
          }
        }
      };

      tryImport();
    });
  };

  return lazy(lazyImport);
};

// Preload a lazy component
export const preloadComponent = (
  importFn: () => Promise<{ default: ComponentType<any> }>
): Promise<void> => {
  return importFn()
    .then(() => {
      console.log('[LazyLoading] Component preloaded successfully');
    })
    .catch((error) => {
      console.warn('[LazyLoading] Component preload failed:', error);
    });
};

// Lazy load pages with route-based splitting
export const createLazyPage = (pageName: string) => {
  // Static imports for better Vite compatibility
  const pageImports: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
    'DashboardPage': () => import('@/pages/DashboardPage.tsx'),
    'ProjectsPage': () => import('@/pages/ProjectsPage.tsx'),
    'ProfilePage': () => import('@/pages/ProfilePage.tsx'),
    'ProposalsPage': () => import('@/pages/ProposalsPage.tsx'),
    'ContractsPage': () => import('@/pages/ContractsPage.tsx'),
    'TimeTrackingPage': () => import('@/pages/TimeTrackingPage.tsx'),
    'PaymentsPage': () => import('@/pages/PaymentsPage.tsx'),
    'EarningsPage': () => import('@/pages/EarningsPage.tsx'),
    'MessagesPage': () => import('@/pages/MessagesPage.tsx'),
    'NotificationsPage': () => import('@/pages/NotificationsPage.tsx'),
    'LoginPage': () => import('@/pages/auth/LoginPage.tsx'),
    'RegisterPage': () => import('@/pages/auth/RegisterPage.tsx'),
    'ForgotPasswordPage': () => import('@/pages/auth/ForgotPasswordPage.tsx'),
    'ResetPasswordPage': () => import('@/pages/auth/ResetPasswordPage.tsx'),
    'HomePage': () => import('@/pages/HomePage.tsx'),
    'AboutPage': () => import('@/pages/AboutPage.tsx'),
    'ContactPage': () => import('@/pages/ContactPage.tsx'),
    'NotFoundPage': () => import('@/pages/NotFoundPage.tsx'),
    'BrowseProjectsPage': () => import('@/pages/BrowseProjectsPage.tsx'),
    'FindFreelancersPage': () => import('@/pages/FindFreelancersPage.tsx'),
    'NewProjectPage': () => import('@/pages/NewProjectPage.tsx'),
    'ProjectDetailPage': () => import('@/pages/ProjectDetailPage.tsx'),
    'FreelancerDetailPage': () => import('@/pages/FreelancerDetailPage.tsx'),
    'ContractDetailPage': () => import('@/pages/ContractDetailPage.tsx'),
  };

  const importFn = pageImports[pageName];
  if (!importFn) {
    throw new Error(`Page "${pageName}" not found in lazy loading registry`);
  }

  return createLazyComponent(importFn, {
    retries: 3,
    retryDelay: 1000,
  });
};

// Lazy load components with component-based splitting
export const createLazyComponentFromPath = (componentPath: string) => {
  // Static imports for better Vite compatibility
  const componentImports: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
    'ui/LoadingSpinner': () => import('@/components/ui/LoadingSpinner.tsx'),
    'ui/ErrorBoundary': () => import('@/components/ui/ErrorBoundary.tsx'),
    'ui/LoadingStates': () => import('@/components/ui/LoadingStates.tsx'),
    'ui/OptimizedComponents': () => import('@/components/ui/OptimizedComponents.tsx'),
    'ui/LazyImage': () => import('@/components/ui/LazyImage.tsx'),
    'projects/ProjectForm': () => import('@/components/projects/ProjectForm.tsx'),
    'proposals/ProposalForm': () => import('@/components/proposals/ProposalForm.tsx'),
    'forms/FormValidation': () => import('@/components/forms/FormValidation.tsx'),
    'layout/Header': () => import('@/components/layout/Header.tsx'),
    'layout/Footer': () => import('@/components/layout/Footer.tsx'),
    'layout/Layout': () => import('@/components/layout/Layout.tsx'),
    'error/ErrorBoundary': () => import('@/components/error/ErrorBoundary.tsx'),
    'auth/ProtectedRoute': () => import('@/components/auth/ProtectedRoute.tsx'),
    'payments/PaymentForm': () => import('@/components/payments/PaymentForm.tsx'),
    'contracts/ContractForm': () => import('@/components/contracts/ContractForm.tsx'),
  };

  const importFn = componentImports[componentPath];
  if (!importFn) {
    throw new Error(`Component "${componentPath}" not found in lazy loading registry`);
  }

  return createLazyComponent(importFn, {
    retries: 2,
    retryDelay: 500,
  });
};

// Preload critical routes
export const preloadCriticalRoutes = () => {
  const criticalRoutes = [
    () => import('@/pages/DashboardPage.tsx'),
    () => import('@/pages/ProjectsPage.tsx'),
    () => import('@/pages/ProfilePage.tsx'),
  ];

  return Promise.allSettled(
    criticalRoutes.map(route => preloadComponent(route))
  );
};

// Preload routes based on user role
export const preloadRoleBasedRoutes = (userRole: string) => {
  const roleRoutes: Record<string, Array<() => Promise<any>>> = {
    admin: [
      () => import('@/pages/admin/AdminDashboardPage.tsx'),
      () => import('@/pages/admin/AdminUsersPage.tsx'),
      () => import('@/pages/admin/AdminProjectsPage.tsx'),
      () => import('@/pages/admin/AdminSettingsPage.tsx'),
    ],
    freelancer: [
      () => import('@/pages/ProposalsPage.tsx'),
      () => import('@/pages/ContractsPage.tsx'),
      () => import('@/pages/TimeTrackingPage.tsx'),
      () => import('@/pages/EarningsPage.tsx'),
    ],
    client: [
      () => import('@/pages/ProjectsPage.tsx'),
      () => import('@/pages/ContractsPage.tsx'),
      () => import('@/pages/PaymentsPage.tsx'),
      () => import('@/pages/NewProjectPage.tsx'),
    ],
  };

  const routes = roleRoutes[userRole] || [];
  return Promise.allSettled(
    routes.map(route => preloadComponent(route))
  );
};

// Intersection Observer for lazy loading images and components
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Lazy load images with intersection observer
export const lazyLoadImage = (
  img: HTMLImageElement,
  src: string,
  options?: IntersectionObserverInit
): (() => void) => {
  const observer = createIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          image.src = src;
          image.classList.remove('lazy');
          observer.unobserve(image);
        }
      });
    },
    options
  );

  img.classList.add('lazy');
  observer.observe(img);

  // Return cleanup function
  return () => observer.disconnect();
};

// Dynamic import with caching
const importCache = new Map<string, Promise<any>>();

export const cachedDynamicImport = <T>(
  importPath: string,
  importFn: () => Promise<T>
): Promise<T> => {
  if (importCache.has(importPath)) {
    return importCache.get(importPath)!;
  }

  const importPromise = importFn();
  importCache.set(importPath, importPromise);

  return importPromise;
};

// Bundle size analyzer helper
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Bundle Analyzer] Run "npm run build:analyze" to analyze bundle size');
  }
};

// Performance monitoring for lazy loading
export const monitorLazyLoading = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('[Performance] Page load time:', entry.duration);
        }
        if (entry.entryType === 'resource' && entry.name.includes('chunk')) {
          console.log('[Performance] Chunk load time:', entry.name, entry.duration);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'resource'] });

    return () => observer.disconnect();
  }

  return () => {};
};