/**
 * Built-in Health Monitoring System
 * Logs errors, performance metrics, and system health to in-memory store
 * and optionally to Supabase learning_log table when connected.
 */

import { getStoredCredentials, createSupabaseClient } from "@/lib/supabase";

export interface ErrorEntry {
  module: string;
  message: string;
  stack: string;
  timestamp: string;
  severity: "warning" | "critical" | "info";
}

export interface PerformanceEntry {
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "critical";
  uptime: number;
  errorCount: number;
  lastError: string | null;
  memoryUsage: number | null;
  platform: string;
}

// In-memory stores
const errorLog: ErrorEntry[] = [];
const perfLog: PerformanceEntry[] = [];
const MAX_LOG_SIZE = 200;
const startTime = Date.now();

/**
 * Log an error to the internal store and optionally to Supabase
 */
export const logError = (entry: ErrorEntry) => {
  errorLog.unshift(entry);
  if (errorLog.length > MAX_LOG_SIZE) errorLog.pop();

  // Async persist to Supabase if connected
  persistToSupabase("error", entry).catch(() => {});
};

/**
 * Log a performance metric
 */
export const logPerformance = (entry: PerformanceEntry) => {
  perfLog.unshift(entry);
  if (perfLog.length > MAX_LOG_SIZE) perfLog.pop();
};

/**
 * Get current health status
 */
export const getHealthStatus = (): HealthStatus => {
  const criticalErrors = errorLog.filter((e) => e.severity === "critical");
  const recentCritical = criticalErrors.filter(
    (e) => Date.now() - new Date(e.timestamp).getTime() < 5 * 60 * 1000
  );

  let memoryUsage: number | null = null;
  try {
    const mem = (performance as any).memory;
    if (mem) {
      memoryUsage = Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100);
    }
  } catch {}

  const platform = typeof (window as any).Capacitor?.getPlatform === 'function'
    ? (window as any).Capacitor.getPlatform()
    : 'web';

  return {
    status: recentCritical.length > 3 ? "critical" : recentCritical.length > 0 ? "degraded" : "healthy",
    uptime: Math.round((Date.now() - startTime) / 1000),
    errorCount: errorLog.length,
    lastError: errorLog[0]?.message || null,
    memoryUsage,
    platform,
  };
};

/**
 * Get error log
 */
export const getErrorLog = (): ErrorEntry[] => [...errorLog];

/**
 * Get performance log
 */
export const getPerformanceLog = (): PerformanceEntry[] => [...perfLog];

/**
 * Clear logs
 */
export const clearLogs = () => {
  errorLog.length = 0;
  perfLog.length = 0;
};

/**
 * Measure a function's execution time
 */
export const measurePerformance = async <T>(
  label: string,
  fn: () => T | Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logPerformance({
      metric: label,
      value: Math.round(duration * 100) / 100,
      unit: "ms",
      timestamp: new Date().toISOString(),
    });
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    logPerformance({
      metric: `${label} (failed)`,
      value: Math.round(duration * 100) / 100,
      unit: "ms",
      timestamp: new Date().toISOString(),
    });
    throw err;
  }
};

/**
 * Persist log entry to Supabase learning_log if connected
 */
const persistToSupabase = async (type: string, data: any) => {
  const creds = getStoredCredentials();
  if (!creds) return;

  try {
    const client = createSupabaseClient(creds.url, creds.anonKey);
    await client.from("learning_log").insert({
      action_type: `health_${type}`,
      details: JSON.stringify(data),
      created_at: new Date().toISOString(),
    });
  } catch {
    // Silent fail — don't create error loops
  }
};

/**
 * Setup global unhandled error/rejection listeners
 */
export const initGlobalErrorHandlers = () => {
  window.addEventListener("error", (event) => {
    logError({
      module: "global",
      message: event.message || "Unhandled error",
      stack: event.error?.stack || `${event.filename}:${event.lineno}`,
      timestamp: new Date().toISOString(),
      severity: "critical",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError({
      module: "global",
      message: event.reason?.message || String(event.reason) || "Unhandled promise rejection",
      stack: event.reason?.stack || "",
      timestamp: new Date().toISOString(),
      severity: "warning",
    });
  });

  // Performance observer for long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            logPerformance({
              metric: "long-task",
              value: Math.round(entry.duration),
              unit: "ms",
              timestamp: new Date().toISOString(),
            });
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // longtask not supported
    }
  }
};
