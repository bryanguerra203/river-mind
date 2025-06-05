// Performance monitoring utility
type MetricData = {
  name: string;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
};

type MemoryThresholds = {
  usedHeapWarning: number;
  usedHeapCritical: number;
  totalHeapWarning: number;
  totalHeapCritical: number;
};

class PerformanceMonitor {
  private metrics: MetricData[] = [];
  private fpsStartTime: number | null = null;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private droppedFrames: number = 0;
  private readonly targetFPS = 60;
  private readonly frameInterval = 1000 / 60;
  private debugMode: boolean = true;
  private memoryThresholds: MemoryThresholds = {
    usedHeapWarning: 50 * 1024 * 1024,    // 50MB
    usedHeapCritical: 100 * 1024 * 1024,  // 100MB
    totalHeapWarning: 100 * 1024 * 1024,  // 100MB
    totalHeapCritical: 200 * 1024 * 1024, // 200MB
  };

  private formatMetric(params: MetricData) {
    const metadataStr = params.metadata ? `\nMetadata: ${JSON.stringify(params.metadata, null, 2)}` : '';
    return `%c[Performance] ${params.name}: ${params.value}${params.unit}${metadataStr}`;
  }

  logMetric(params: MetricData) {
    this.metrics.push(params);
    if (this.debugMode) {
      console.log(
        this.formatMetric(params),
        'color: #4CAF50; font-weight: bold;'
      );
    }
  }

  getMemoryInfo() {
    try {
      if (global.performance?.memory) {
        const info = {
          usedJSHeapSize: global.performance.memory.usedJSHeapSize,
          totalJSHeapSize: global.performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: global.performance.memory.jsHeapSizeLimit,
        };

        if (this.debugMode) {
          // Check used heap size
          const usedHeapStatus = this.getMemoryStatus(
            info.usedJSHeapSize,
            this.memoryThresholds.usedHeapWarning,
            this.memoryThresholds.usedHeapCritical
          );

          // Check total heap size
          const totalHeapStatus = this.getMemoryStatus(
            info.totalJSHeapSize,
            this.memoryThresholds.totalHeapWarning,
            this.memoryThresholds.totalHeapCritical
          );

          console.log(
            '%c[Performance] Memory Usage:',
            'color: #2196F3; font-weight: bold;',
            '\nUsed Heap:', this.formatBytes(info.usedJSHeapSize),
            usedHeapStatus,
            '\nTotal Heap:', this.formatBytes(info.totalJSHeapSize),
            totalHeapStatus,
            '\nHeap Limit:', this.formatBytes(info.jsHeapSizeLimit)
          );

          // Log warnings if any
          if (usedHeapStatus.includes('WARNING') || totalHeapStatus.includes('WARNING')) {
            console.warn(
              '%c[Performance] Memory Warning:',
              'color: #FF9800; font-weight: bold;',
              '\nConsider optimizing memory usage or implementing cleanup strategies.'
            );
          }

          if (usedHeapStatus.includes('CRITICAL') || totalHeapStatus.includes('CRITICAL')) {
            console.error(
              '%c[Performance] Memory Critical:',
              'color: #F44336; font-weight: bold;',
              '\nImmediate action required to prevent app crashes or performance issues.'
            );
          }
        }

        return info;
      }
    } catch (error) {
      console.warn('Memory info not available:', error);
    }
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };
  }

  private getMemoryStatus(value: number, warningThreshold: number, criticalThreshold: number): string {
    if (value >= criticalThreshold) {
      return ' 🔴 CRITICAL';
    } else if (value >= warningThreshold) {
      return ' 🟠 WARNING';
    }
    return ' 🟢 OK';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  setMemoryThresholds(thresholds: Partial<MemoryThresholds>) {
    this.memoryThresholds = {
      ...this.memoryThresholds,
      ...thresholds,
    };
  }

  startFPSMonitoring() {
    this.fpsStartTime = performance.now();
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.lastFrameTime = this.fpsStartTime;
    if (this.debugMode) {
      console.log('%c[Performance] Starting FPS monitoring', 'color: #FF9800; font-weight: bold;');
    }
    this.monitorFPS();
  }

  private monitorFPS() {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    
    if (elapsed > this.frameInterval) {
      const dropped = Math.floor((elapsed - this.frameInterval) / this.frameInterval);
      this.droppedFrames += dropped;
    }
    
    this.frameCount++;
    this.lastFrameTime = now;
    
    requestAnimationFrame(() => this.monitorFPS());
  }

  stopFPSMonitoring() {
    if (!this.fpsStartTime) return { averageFPS: 0, minFPS: 0, maxFPS: 0, droppedFrames: 0 };
    
    const endTime = performance.now();
    const duration = (endTime - this.fpsStartTime) / 1000; // Convert to seconds
    const averageFPS = this.frameCount / duration;
    
    const fpsInfo = {
      averageFPS,
      minFPS: Math.max(0, averageFPS - 10), // Estimate
      maxFPS: Math.min(60, averageFPS + 10), // Estimate
      droppedFrames: this.droppedFrames,
    };

    if (this.debugMode) {
      console.log(
        '%c[Performance] FPS Info:',
        'color: #FF9800; font-weight: bold;',
        '\nAverage FPS:', fpsInfo.averageFPS.toFixed(2),
        '\nMin FPS:', fpsInfo.minFPS.toFixed(2),
        '\nMax FPS:', fpsInfo.maxFPS.toFixed(2),
        '\nDropped Frames:', fpsInfo.droppedFrames
      );
    }

    this.fpsStartTime = null;
    this.frameCount = 0;
    
    return fpsInfo;
  }

  getMetrics() {
    if (this.debugMode) {
      console.log(
        '%c[Performance] All Metrics:',
        'color: #9C27B0; font-weight: bold;',
        this.metrics
      );
    }
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
    if (this.debugMode) {
      console.log('%c[Performance] Metrics cleared', 'color: #F44336; font-weight: bold;');
    }
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Track screen render time
export const trackScreenRender = (screenName: string) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      performanceMonitor.logMetric({
        name: `${screenName}_render_time`,
        value: renderTime,
        unit: 'ms',
      });
    }
  };
};

// Track component render time
export const trackComponentRender = (componentName: string) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      performanceMonitor.logMetric({
        name: `${componentName}_render_time`,
        value: renderTime,
        unit: 'ms',
      });
    }
  };
};

// Track function execution time
export const trackFunctionExecution = (functionName: string) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      performanceMonitor.logMetric({
        name: `${functionName}_execution_time`,
        value: executionTime,
        unit: 'ms',
      });
    }
  };
};

// Track memory usage
export const trackMemoryUsage = () => {
  return performanceMonitor.getMemoryInfo();
};

// Track FPS (Frames Per Second)
export const trackFPS = () => {
  performanceMonitor.startFPSMonitoring();
  
  return {
    stop: () => {
      return performanceMonitor.stopFPSMonitoring();
    }
  };
};

// Track network requests
export const trackNetworkRequest = (requestName: string) => {
  const startTime = performance.now();
  
  return {
    end: (status: number) => {
      const endTime = performance.now();
      const requestTime = endTime - startTime;
      performanceMonitor.logMetric({
        name: `${requestName}_request_time`,
        value: requestTime,
        unit: 'ms',
        metadata: { status }
      });
    }
  };
};

// Track list performance
export const trackListPerformance = (listName: string) => {
  const startTime = performance.now();
  let itemCount = 0;
  
  return {
    addItem: () => {
      itemCount++;
    },
    end: () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      performanceMonitor.logMetric({
        name: `${listName}_render_time`,
        value: renderTime,
        unit: 'ms',
        metadata: { itemCount }
      });
    }
  };
};

// Export the performance monitor instance for direct use
export { performanceMonitor }; 