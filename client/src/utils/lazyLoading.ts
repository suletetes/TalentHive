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
          
          if (attempt < retries) {
            console.warn(`[LazyLoading] Import failed, retrying (${attempt}/${retries})...`);
            setTimeout(tryImport, retryDelay * attempt);
          } else {
            console.error('[LazyLoading] Import failed after all retries:', error);
            reject(error);
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
  return createLazyComponent(
    () => import(`@/pages/${pageName}`),
    {
      retries: 3,
      retryDelay: 1000,
    }
  );
};

// Lazy load components with component-based splitting
export const createLazyComponentFromPath = (componentPath: string) => {
  return createLazyComponent(
    () => import(`@/components/${componentPath}`),
    {
      retries: 2,
      retryDelay: 500,
    }
  );
};

// Preload critical routes
export const preloadCriticalRoutes = () => {
  const criticalRoutes = [
    () => import('@/pages/DashboardPage'),
    () => import('@/pages/ProjectsPage'),
    () => import('@/pages/ProfilePage'),
  ];

  return Promise.allSettled(
    criticalRoutes.map(route => preloadComponent(route))
  );
};

// Preload routes based on user role
export const preloadRoleBasedRoutes = (userRole: string) => {
  const roleRoutes: Record<string, Array<() => Promise<any>>> = {
    admin: [
      () => import('@/pages/admin/AdminDashboardPage'),
      () => import('@/pages/admin/AdminUsersPage'),
      () => import('@/pages/admin/AdminProjectsPage'),
    ],
    freelancer: [
      () => import('@/pages/ProposalsPage'),
      () => import('@/pages/ContractsPage'),
      () => import('@/pages/TimeTrackingPage'),
    ],
    client: [
      () => import('@/pages/ProjectsPage'),
      () => import('@/pages/ContractsPage'),
      () => import('@/pages/PaymentsPage'),
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