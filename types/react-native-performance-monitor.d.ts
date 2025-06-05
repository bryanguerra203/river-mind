declare module 'react-native-performance-monitor' {
  export class PerformanceMonitor {
    constructor();
    logMetric(params: {
      name: string;
      value: number;
      unit: string;
      metadata?: Record<string, any>;
    }): void;
    getMemoryInfo(): {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
    startFPSMonitoring(): void;
    stopFPSMonitoring(): {
      averageFPS: number;
      minFPS: number;
      maxFPS: number;
      droppedFrames: number;
    };
  }
} 