import client from 'prom-client';
import { prisma } from './prisma';

const globalForMetrics = global as typeof global & {
  metricsRegistry?: client.Registry;
  defaultMetricsRegistered?: boolean;
};

// Retrieve or initialize the single global registry to persist across compilation cycles
export const registry =
  globalForMetrics.metricsRegistry ??
  (globalForMetrics.metricsRegistry = new client.Registry());

// Only register default system metrics once to prevent duplicate registration crashes
if (!globalForMetrics.defaultMetricsRegistered) {
  try {
    client.collectDefaultMetrics({ register: registry });
    globalForMetrics.defaultMetricsRegistered = true;
  } catch (err) {
    console.warn('Default metrics already collected, skipping registration.');
  }
}

// HMR-safe metric builders that lookup or register dynamically
export function getOrCreateGauge(name: string, help: string, labelNames: string[] = []): client.Gauge<string> {
  const existing = registry.getSingleMetric(name);
  if (existing) return existing as client.Gauge<string>;
  return new client.Gauge({ name, help, labelNames, registers: [registry] });
}

export function getOrCreateCounter(name: string, help: string, labelNames: string[] = []): client.Counter<string> {
  const existing = registry.getSingleMetric(name);
  if (existing) return existing as client.Counter<string>;
  return new client.Counter({ name, help, labelNames, registers: [registry] });
}

export function getOrCreateHistogram(name: string, help: string, labelNames: string[] = [], buckets?: number[]): client.Histogram<string> {
  const existing = registry.getSingleMetric(name);
  if (existing) return existing as client.Histogram<string>;
  return new client.Histogram({
    name,
    help,
    labelNames,
    buckets: buckets || [0.1, 0.3, 0.5, 1, 2, 5],
    registers: [registry]
  });
}

// Register standard HTTP telemetry endpoints safely with exact requested labels and buckets
getOrCreateCounter('http_requests_total', 'Total HTTP requests', ['path', 'method', 'status']);
getOrCreateHistogram(
  'http_request_duration_seconds',
  'HTTP request duration in seconds',
  ['path', 'method', 'status'],
  [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
);

/**
 * Dynamically fetch current CRM state from Prisma and update Prometheus Gauge metrics.
 * Ensures the exported Prometheus metric payload always reports high-fidelity and fresh values.
 */
export async function updateDynamicBusinessMetrics() {
  try {
    // Lookup or create business gauges on demand (100% resilient to Next.js HMR)
    const leadsGauge = getOrCreateGauge(
      'crm_leads_total',
      'Total number of CRM leads by stage, priority, and subStatus',
      ['stage', 'priority', 'subStatus']
    );
    const dealValueGauge = getOrCreateGauge(
      'crm_deal_value_inr_total',
      'Total deal value in INR of leads by stage and priority',
      ['stage', 'priority']
    );
    
    leadsGauge.reset();
    dealValueGauge.reset();

    // 1. Leads and Deal Value Aggregations
    const leads = await prisma.lead.findMany({
      select: {
        stage: true,
        priority: true,
        subStatus: true,
        dealValueInr: true,
      }
    });

    const leadCounts: Record<string, number> = {};
    const dealValues: Record<string, number> = {};

    for (const lead of leads) {
      const stage = String(lead.stage || 'NEW');
      const priority = String(lead.priority || 'MEDIUM');
      const subStatus = String(lead.subStatus || 'BLANK');
      
      const leadsKey = `${stage}:${priority}:${subStatus}`;
      leadCounts[leadsKey] = (leadCounts[leadsKey] || 0) + 1;

      const dealKey = `${stage}:${priority}`;
      dealValues[dealKey] = (dealValues[dealKey] || 0) + Number(lead.dealValueInr || 0);
    }

    for (const [key, count] of Object.entries(leadCounts)) {
      const [stage, priority, subStatus] = key.split(':');
      leadsGauge.set({ stage, priority, subStatus }, count);
    }

    for (const [key, val] of Object.entries(dealValues)) {
      const [stage, priority] = key.split(':');
      dealValueGauge.set({ stage, priority }, val);
    }

    // 2. Users count by role
    const users = await prisma.user.findMany({
      select: { role: true }
    });
    const usersGauge = getOrCreateGauge(
      'crm_users_total',
      'Total number of registered CRM users by role',
      ['role']
    );
    usersGauge.reset();

    const userCounts: Record<string, number> = {};
    for (const u of users) {
      userCounts[u.role] = (userCounts[u.role] || 0) + 1;
    }
    for (const [role, count] of Object.entries(userCounts)) {
      usersGauge.set({ role }, count);
    }

    // 3. Total Proposals Count
    const proposalsCount = await prisma.proposal.count();
    const proposalsGauge = getOrCreateGauge(
      'crm_proposals_total',
      'Total number of generated business proposals'
    );
    proposalsGauge.set(proposalsCount);

    // 4. Reminders count by status and type
    const reminders = await prisma.reminder.findMany({
      select: { status: true, type: true }
    });
    const remindersGauge = getOrCreateGauge(
      'crm_reminders_total',
      'Total number of follow-up reminders by status and type',
      ['status', 'type']
    );
    remindersGauge.reset();

    const reminderCounts: Record<string, number> = {};
    for (const r of reminders) {
      const key = `${r.status}:${r.type}`;
      reminderCounts[key] = (reminderCounts[key] || 0) + 1;
    }
    for (const [key, count] of Object.entries(reminderCounts)) {
      const [status, type] = key.split(':');
      remindersGauge.set({ status, type }, count);
    }

  } catch (error) {
    console.error('Failed to update dynamic business metrics:', error);
  }
}

/**
 * High-fidelity wrapper to measure and record exact request durations (in seconds)
 * and correct HTTP response status codes directly inside Next.js API routes.
 */
export function withRouteTelemetry(handler: Function) {
  return async function (req: Request, ...args: any[]) {
    const start = Date.now();
    const urlObj = new URL(req.url);
    const path = urlObj.pathname;
    const method = req.method;

    try {
      const response = await handler(req, ...args);
      const duration = (Date.now() - start) / 1000;
      const status = String(response?.status || 200);

      const httpRequestsTotal = registry.getSingleMetric('http_requests_total') as client.Counter<string>;
      const httpRequestDurationSeconds = registry.getSingleMetric('http_request_duration_seconds') as client.Histogram<string>;

      if (httpRequestsTotal) {
        httpRequestsTotal.inc({ path, method, status });
      }
      if (httpRequestDurationSeconds) {
        httpRequestDurationSeconds.observe({ path, method, status }, duration);
      }

      return response;
    } catch (err: any) {
      const duration = (Date.now() - start) / 1000;
      const status = String(err?.status || 500);

      const httpRequestsTotal = registry.getSingleMetric('http_requests_total') as client.Counter<string>;
      const httpRequestDurationSeconds = registry.getSingleMetric('http_request_duration_seconds') as client.Histogram<string>;

      if (httpRequestsTotal) {
        httpRequestsTotal.inc({ path, method, status });
      }
      if (httpRequestDurationSeconds) {
        httpRequestDurationSeconds.observe({ path, method, status }, duration);
      }

      throw err;
    }
  };
}