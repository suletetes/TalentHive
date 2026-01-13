/**
 * Performance monitoring and optimization utilities
 */

import React from 'react';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ApiPerformanceMetric extends PerformanceMetric {
  method: string;
  url: string;
  status?: number;
  responseSize?: number;
  cached?: boolean;
}

export interface ComponentPerformanceMetric extends PerformanceMetric {
  componentName: string;
  renderCount?: number;
  props?: any;
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private apiMetrics: ApiPerformanceMetric[] = [];
  private componentMetrics: ComponentPerformanceMetric[] = [];
  private enabled: boolean;

  constructor(enabled: boolean = !import.meta.env.PROD) {
    this.enabled = enabled;
  }

  /**
   * Start measuring performance
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);
  }

  /**
   * End measuring performance
   */
  end(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[PERFORMANCE] No metric found for: ${name}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(`[PERFORMANCE] ${name}: ${metric.duration.toFixed(2)}ms`, metric.metadata);

    return metric.duration;
  }

  /**
   * Measure API call performance
   */
  measureApiCall<T>(
    method: string,
    url: string,
    requestFn: () => Promise<T>,
    cached: boolean = false
  ): Promise<T> {
    if (!this.enabled) return requestFn();

    const startTime = performance.now();
    const metricName = `api_${method}_${url}`;

    return requestFn()
      .then((result) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const metric: ApiPerformanceMetric = {
          name: metricName,
          method,
          url,
          startTime,
          endTime,
          duration,
          cached,
          responseSize: this.estimateResponseSize(result),
        };

        this.apiMetrics.push(metric);

        // Log slow API calls
        if (duration > 1000) {
          console.warn(`[PERFORMANCE] Slow API call: ${method} ${url} - ${duration.toFixed(2)}ms`);
        }

        return result;
      })
      .catch((error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const metric: ApiPerformanceMetric = {
          name: metricName,
          method,
          url,
          startTime,
          endTime,
          duration,
          cached,
          status: error.response?.status,
        };

        this.apiMetrics.push(metric);

        console.error(`[PERFORMANCE] Failed API call: ${method} ${url} - ${duration.toFixed(2)}ms`, error);
        throw error;
      });
  }

  /**
   * Measure component render performance
   */
  measureComponentRender(
    componentName: string,
    renderFn: () => void,
    props?: any
  ): void {
    if (!this.enabled) {
      renderFn();
      return;
    }

    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: ComponentPerformanceMetric = {
      name: `component_${componentName}`,
      componentName,
      startTime,
      endTime,
      duration,
      props,
    };

    this.componentMetrics.push(metric);

    // Log slow renders
    if (duration > 16) { // 60fps = 16.67ms per frame
      console.warn(`[PERFORMANCE] Slow render: ${componentName} - ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    apiCalls: {
      total: number;
      averageTime: number;
      slowCalls: ApiPerformanceMetric[];
      cachedCalls: number;
    };
    components: {
      total: number;
      averageRenderTime: number;
      slowRenders: ComponentPerformanceMetric[];
    };
  } {
    const apiStats = {
      total: this.apiMetrics.length,
      averageTime: this.apiMetrics.length > 0 
        ? this.apiMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / this.apiMetrics.length
        : 0,
      slowCalls: this.apiMetrics.filter(m => (m.duration || 0) > 1000),
      cachedCalls: this.apiMetrics.filter(m => m.cached).length,
    };

    const componentStats = {
      total: this.componentMetrics.length,
      averageRenderTime: this.componentMetrics.length > 0
        ? this.componentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / this.componentMetrics.length
        : 0,
      slowRenders: this.componentMetrics.filter(m => (m.duration || 0) > 16),
    };

    return {
      apiCalls: apiStats,
      components: componentStats,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.apiMetrics = [];
    this.componentMetrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    api: ApiPerformanceMetric[];
    components: ComponentPerformanceMetric[];
    timestamp: number;
  } {
    return {
      api: [...this.apiMetrics],
      components: [...this.componentMetrics],
      timestamp: Date.now(),
    };
  }

  /**
   * Estimate response size
   */
  private estimateResponseSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance decorator for functions
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return ((...args: any[]) => {
    performanceMonitor.start(name);
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.end(name);
        });
      }
      
      performanceMonitor.end(name);
      return result;
    } catch (error) {
      performanceMonitor.end(name);
      throw error;
    }
  }) as T;
}

/**
 * React hook for measuring component performance
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  React.useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 16) {
      console.warn(`[PERFORMANCE] Slow component mount: ${componentName} - ${duration.toFixed(2)}ms`);
    }
  }, [componentName, startTime]);

  return {
    measureRender: (renderFn: () => void, props?: any) => {
      performanceMonitor.measureComponentRender(componentName, renderFn, props);
    },
  };
}

/**
 * Web Vitals monitoring
 */
export class WebVitalsMonitor {
  private vitals: Map<string, number> = new Map();

  constructor() {
    this.setupWebVitals();
  }

  private setupWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.vitals.set('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('[WEB VITALS] LCP observer failed:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.vitals.set('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('[WEB VITALS] FID observer failed:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.vitals.set('CLS', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('[WEB VITALS] CLS observer failed:', error);
      }
    }

    // Time to First Byte (TTFB)
    if (window.performance && window.performance.timing) {
      const ttfb = window.performance.timing.responseStart - window.performance.timing.requestStart;
      this.vitals.set('TTFB', ttfb);
    }
  }

  getVitals(): Record<string, number> {
    return Object.fromEntries(this.vitals);
  }

  logVitals(): void {
    const vitals = this.getVitals();
    console.log('[WEB VITALS]', vitals);

    // Log warnings for poor vitals
    if (vitals.LCP > 2500) {
      console.warn('[WEB VITALS] Poor LCP:', vitals.LCP);
    }
    if (vitals.FID > 100) {
      console.warn('[WEB VITALS] Poor FID:', vitals.FID);
    }
    if (vitals.CLS > 0.1) {
      console.warn('[WEB VITALS] Poor CLS:', vitals.CLS);
    }
  }
}

// Global web vitals monitor
export const webVitalsMonitor = new WebVitalsMonitor();

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize(): void {
  if (import.meta.env.DEV) {
    console.log('[BUNDLE ANALYSIS] Bundle size analysis only available in production build');
    return;
  }

  // This would typically be done with webpack-bundle-analyzer or similar tools
  // Here we provide a simple runtime analysis
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  console.log('[BUNDLE ANALYSIS] Scripts:', scripts.length);
  console.log('[BUNDLE ANALYSIS] Stylesheets:', styles.length);

  // Estimate total bundle size (rough approximation)
  let totalSize = 0;
  scripts.forEach((script: any) => {
    if (script.src && script.src.includes(window.location.origin)) {
      // This is a rough estimate - actual size would need to be fetched
      totalSize += 100000; // Assume 100KB per script
    }
  });

  console.log('[BUNDLE ANALYSIS] Estimated bundle size:', `${(totalSize / 1024).toFixed(2)}KB`);
}

/**
 * Memory usage monitoring
 */
export function monitorMemoryUsage(): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('[MEMORY]', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
    });

    // Warn if memory usage is high
    if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
      console.warn('[MEMORY] High memory usage detected');
    }
  }
}

/**
 * Setup performance monitoring
 */
export function setupPerformanceMonitoring(): void {
  // Log web vitals after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      webVitalsMonitor.logVitals();
      monitorMemoryUsage();
    }, 1000);
  });

  // Monitor memory usage periodically
  setInterval(monitorMemoryUsage, 60000); // Every minute

  // Log performance stats periodically
  setInterval(() => {
    const stats = performanceMonitor.getStats();
    if (stats.apiCalls.total > 0 || stats.components.total > 0) {
      console.log('[PERFORMANCE STATS]', stats);
    }
  }, 300000); // Every 5 minutes
}