// Performance Optimizer - Frannie NAILS
// Sistema avanzato di ottimizzazione performance

import React from 'react';
import { QueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface CacheConfig {
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
}

// 🚀 CONFIGURAZIONI CACHE INTELLIGENTI
export const CACHE_CONFIGS: { [key: string]: CacheConfig } = {
  // Dati statici (raramente cambiano)
  static: {
    staleTime: 1000 * 60 * 30, // 30 minuti
    gcTime: 1000 * 60 * 60 * 24, // 24 ore
    refetchOnWindowFocus: false
  },
  
  // Dati dinamici (cambiano spesso)
  dynamic: {
    staleTime: 1000 * 60 * 2, // 2 minuti
    gcTime: 1000 * 60 * 10, // 10 minuti  
    refetchOnWindowFocus: true
  },
  
  // Dati real-time (sempre freschi)
  realtime: {
    staleTime: 0,
    gcTime: 1000 * 60 * 5, // 5 minuti
    refetchOnWindowFocus: true
  }
};

// 📊 PERFORMANCE MONITOR
class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initObservers();
  }

  private initObservers(): void {
    if (typeof window === 'undefined') return;

    // 📏 Core Web Vitals Observer
    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.largestContentfulPaint = lastEntry.startTime;
        console.log(`🎯 LCP: ${Math.round(lastEntry.startTime)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FID Observer  
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          console.log(`⚡ FID: ${Math.round(entry.processingStart - entry.startTime)}ms`);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // CLS Observer
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cumulativeLayoutShift = clsValue;
        console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
      
    } catch (error) {
      console.warn('⚠️ Performance observers non supportati:', error);
    }
  }

  // 📈 RACCOGLIE METRICHE NAVIGATION
  collectNavigationMetrics(): void {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      
      console.log('📊 Navigation Metrics:', {
        'Load Time': `${Math.round(this.metrics.loadTime)}ms`,
        'DOM Content Loaded': `${Math.round(this.metrics.domContentLoaded)}ms`,
        'DNS Lookup': `${Math.round(navigation.domainLookupEnd - navigation.domainLookupStart)}ms`,
        'TCP Connection': `${Math.round(navigation.connectEnd - navigation.connectStart)}ms`,
        'Request/Response': `${Math.round(navigation.responseEnd - navigation.requestStart)}ms`
      });
    }
  }

  // 🎯 OTTIMIZZAZIONE QUERY CLIENT
  optimizeQueryClient(queryClient: QueryClient): void {
    // Impostazioni globali ottimizzate
    queryClient.setDefaultOptions({
      queries: {
        staleTime: CACHE_CONFIGS.dynamic.staleTime,
        gcTime: CACHE_CONFIGS.dynamic.gcTime,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error: any) => {
          // Retry solo per errori di rete, non per 4xx
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 3;
        }
      },
      mutations: {
        retry: 1
      }
    });

    console.log('🔧 Query client ottimizzato');
  }

  // 🗑️ GARBAGE COLLECTION INTELLIGENTE
  scheduleGarbageCollection(queryClient: QueryClient): void {
    // Pulisci cache ogni 10 minuti
    setInterval(() => {
      queryClient.getQueryCache().clear();
      console.log('🗑️ Cache queries pulita');
    }, 1000 * 60 * 10);

    // Pulisci quando la pagina diventa invisibile
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          queryClient.invalidateQueries();
          console.log('👁️ Queries invalidate (pagina nascosta)');
        }
      });
    }
  }

  // 📱 OTTIMIZZAZIONI MOBILE
  enableMobileOptimizations(): void {
    if (typeof window === 'undefined') return;

    // Disabilita animazioni su dispositivi lenti
    const isSlowDevice = navigator.hardwareConcurrency < 4 || 
                        (navigator as any).deviceMemory < 4;
    
    if (isSlowDevice) {
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
      console.log('📱 Animazioni disabilitate su dispositivo lento');
    }

    // Lazy loading delle immagini
    if ('loading' in HTMLImageElement.prototype) {
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        (img as HTMLImageElement).loading = 'lazy';
      });
    }
  }

  // 🔄 PRELOAD ROUTES CRITICHE
  preloadCriticalRoutes(): void {
    const criticalRoutes = [
      '/admin-clients',
      '/admin-gallery', 
      '/dashboard',
      '/calendar'
    ];

    criticalRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });

    console.log('🔄 Routes critiche preloadate');
  }

  // 📊 REPORT PERFORMANCE
  generatePerformanceReport(): PerformanceMetrics & { score: number } {
    const report = { ...this.metrics } as PerformanceMetrics;
    
    // Calcola score performance (0-100)
    let score = 100;
    
    if (report.largestContentfulPaint > 2500) score -= 30;
    else if (report.largestContentfulPaint > 1000) score -= 15;
    
    if (report.firstInputDelay > 100) score -= 25;
    else if (report.firstInputDelay > 50) score -= 10;
    
    if (report.cumulativeLayoutShift > 0.25) score -= 25;
    else if (report.cumulativeLayoutShift > 0.1) score -= 10;
    
    if (report.loadTime > 3000) score -= 20;
    else if (report.loadTime > 1500) score -= 10;

    console.log(`🏆 Performance Score: ${Math.max(0, score)}/100`);
    
    return {
      ...report,
      score: Math.max(0, score)
    };
  }

  // 🧹 CLEANUP
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 🎨 LAZY LOADING COMPONENTS
export function createLazyComponent(importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  return React.lazy(() => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(importFn());
      }, 1); // Micro delay per non bloccare UI
    });
  });
}

// 🖼️ IMAGE OPTIMIZATION
export function optimizeImages(): void {
  if (typeof window === 'undefined') return;

  const images = document.querySelectorAll('img');
  
  images.forEach((img) => {
    // Lazy loading nativo
    if (!img.loading) {
      img.loading = 'lazy';
    }
    
    // Decode async
    if ('decoding' in img) {
      img.decoding = 'async';
    }
    
    // Preload LCP images
    if (img.getBoundingClientRect().top < window.innerHeight) {
      img.loading = 'eager';
    }
  });
}

// 💾 INTELLIGENT CACHING
export function setupIntelligentCaching(queryClient: QueryClient): void {
  // Cache per tipo di dato
  const cacheRules = [
    {
      queryKey: ['/api/admin/clients'],
      config: CACHE_CONFIGS.dynamic
    },
    {
      queryKey: ['/api/photos'],
      config: CACHE_CONFIGS.static
    },
    {
      queryKey: ['/api/appointments'],
      config: CACHE_CONFIGS.realtime
    }
  ];

  cacheRules.forEach(rule => {
    queryClient.setQueryDefaults(rule.queryKey, rule.config);
  });

  console.log('💾 Intelligent caching configurato');
}

// 🚀 INIZIALIZZAZIONE PERFORMANCE
export function initPerformanceOptimizations(queryClient: QueryClient): PerformanceMonitor {
  const monitor = new PerformanceMonitor();
  
  // Setup ottimizzazioni
  monitor.optimizeQueryClient(queryClient);
  monitor.scheduleGarbageCollection(queryClient);
  monitor.enableMobileOptimizations();
  
  setupIntelligentCaching(queryClient);
  optimizeImages();
  
  // Preload after page load
  setTimeout(() => {
    monitor.preloadCriticalRoutes();
    monitor.collectNavigationMetrics();
  }, 2000);
  
  // Report finale dopo 5 secondi
  setTimeout(() => {
    monitor.generatePerformanceReport();
  }, 5000);
  
  console.log('🚀 Performance optimizations inizializzate');
  return monitor;
}

// Singleton
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

export function setPerformanceMonitor(monitor: PerformanceMonitor): void {
  performanceMonitor = monitor;
}