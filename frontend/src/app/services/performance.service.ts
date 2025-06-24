import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  domNodes: number;
  lastMeasurement: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    domNodes: 0,
    lastMeasurement: Date.now()
  });

  public metrics$ = this.metricsSubject.asObservable();

  // 🚀 Performance: Measure Render Time
  measureRenderTime<T>(operation: () => T, operationName: string): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`🚀 Performance: ${operationName} took ${renderTime.toFixed(2)}ms`);
    
    this.updateMetrics({ renderTime });
    return result;
  }

  // 🚀 Performance: Measure API Response Time
  measureApiCall<T>(apiCall: Observable<T>, apiName: string): Observable<T> {
    const startTime = performance.now();
    
    return new Observable(observer => {
      apiCall.subscribe({
        next: (data) => {
          const endTime = performance.now();
          const apiResponseTime = endTime - startTime;
          
          console.log(`🚀 Performance: API ${apiName} took ${apiResponseTime.toFixed(2)}ms`);
          this.updateMetrics({ apiResponseTime });
          
          observer.next(data);
        },
        error: (error) => {
          const endTime = performance.now();
          const apiResponseTime = endTime - startTime;
          
          console.log(`❌ Performance: API ${apiName} failed after ${apiResponseTime.toFixed(2)}ms`);
          this.updateMetrics({ apiResponseTime });
          
          observer.error(error);
        },
        complete: () => observer.complete()
      });
    });
  }

  // 🚀 Performance: Memory Usage Monitoring
  measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      
      console.log(`🚀 Performance: Memory usage: ${memoryUsage.toFixed(2)}MB`);
      this.updateMetrics({ memoryUsage });
    }
  }

  // 🚀 Performance: DOM Nodes Count
  measureDOMComplexity(): void {
    const domNodes = document.querySelectorAll('*').length;
    
    console.log(`🚀 Performance: DOM nodes: ${domNodes}`);
    this.updateMetrics({ domNodes });

    if (domNodes > 3000) {
      console.warn('⚠️ Performance Warning: High DOM node count detected!');
    }
  }

  // 🚀 Performance: Debounced Function
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // 🚀 Performance: Throttled Function
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let isThrottled = false;
    
    return (...args: Parameters<T>) => {
      if (!isThrottled) {
        func.apply(this, args);
        isThrottled = true;
        setTimeout(() => {
          isThrottled = false;
        }, delay);
      }
    };
  }

  // 🚀 Performance: Bundle Analysis
  analyzeBundleSize(): void {
    if ('getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        const loadTime = entry.loadEventEnd - entry.fetchStart;
        const domContentLoadedTime = entry.domContentLoadedEventEnd - entry.fetchStart;
        
        console.log(`🚀 Performance: Page load time: ${loadTime.toFixed(2)}ms`);
        console.log(`🚀 Performance: DOM content loaded: ${domContentLoadedTime.toFixed(2)}ms`);
      }
    }
  }

  // 🚀 Performance: Virtual Scrolling Optimization
  calculateOptimalItemSize(itemCount: number, containerHeight: number): number {
    // Calculate optimal item size based on container and item count
    const maxItemsVisible = Math.ceil(containerHeight / 40); // Minimum 40px per item
    const optimalItemSize = Math.max(40, Math.min(120, containerHeight / Math.min(itemCount, maxItemsVisible)));
    
    console.log(`🚀 Performance: Optimal virtual scroll item size: ${optimalItemSize}px`);
    return optimalItemSize;
  }

  // 🚀 Performance: Memory Leak Detection
  detectMemoryLeaks(): void {
    if ('memory' in performance) {
      const initialMemory = (performance as any).memory.usedJSHeapSize;
      
      setTimeout(() => {
        const currentMemory = (performance as any).memory.usedJSHeapSize;
        const memoryIncrease = currentMemory - initialMemory;
        
        if (memoryIncrease > 10 * 1024 * 1024) { // 10MB increase
          console.warn('⚠️ Performance Warning: Potential memory leak detected!');
          console.warn(`Memory increased by ${(memoryIncrease / (1024 * 1024)).toFixed(2)}MB`);
        }
      }, 30000); // Check after 30 seconds
    }
  }

  // 🚀 Performance: Comprehensive Performance Report
  generatePerformanceReport(): void {
    this.measureMemoryUsage();
    this.measureDOMComplexity();
    this.analyzeBundleSize();
    this.detectMemoryLeaks();
    
    const currentMetrics = this.metricsSubject.value;
    
    console.group('🚀 Performance Report');
    console.log('Render Time:', `${currentMetrics.renderTime.toFixed(2)}ms`);
    console.log('API Response Time:', `${currentMetrics.apiResponseTime.toFixed(2)}ms`);
    console.log('Memory Usage:', `${currentMetrics.memoryUsage.toFixed(2)}MB`);
    console.log('DOM Nodes:', currentMetrics.domNodes);
    console.log('Timestamp:', new Date(currentMetrics.lastMeasurement).toISOString());
    console.groupEnd();
  }

  private updateMetrics(updates: Partial<PerformanceMetrics>): void {
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      ...updates,
      lastMeasurement: Date.now()
    });
  }
} 