import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class AppService {
  private requestCount = 0;
  private startTime = Date.now();

  getHome(): Record<string, any> {
    this.requestCount++; // Track total requests

    return {
      service: 'Dashboard API',
      version: '1.1.0',
      environment: process.env.NODE_ENV || 'development',
      status: 'running',
      timestamp: new Date().toISOString(),

      // Uptime tracking
      uptime: process.uptime(),
      startedAt: new Date(this.startTime).toISOString(),

      // System performance metrics
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        cpuUsage: process.cpuUsage(),
        loadAverage: os.loadavg(),
        memoryUsage: {
          total: os.totalmem(),
          free: os.freemem(),
          used: process.memoryUsage(),
        },
      },

      network: {
        activeConnections: this.getActiveConnections(),
      },

      apiStats: {
        totalRequests: this.requestCount,
        processId: process.pid,
      },

      message: 'Welcome to the Dashboard API! 🚀',
    };
  }

  private getActiveConnections(): number {
    return Object.keys(require('net').connections || {}).length;
  }
}
