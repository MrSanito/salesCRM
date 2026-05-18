import client from 'prom-client';
import { prisma } from './prisma';

const globalForMetrics = global as typeof global & {
  metricsRegistry?: client.Registry;
};

function createRegistry() {
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });

  // HTTP Request metrics
  new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [registry],
  });

  new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5],
    registers: [registry],
  });

  // Premium CRM Business Gauges
  new client.Gauge({
    name: 'crm_leads_total',
    help: 'Total number of CRM leads by stage, priority, and subStatus',
    labelNames: ['stage', 'priority', 'subStatus'],
    registers: [registry],
  });

  new client.Gauge({
    name: 'crm_deal_value_inr_total',
    help: 'Total deal value in INR of leads by stage and priority',
    labelNames: ['stage', 'priority'],
    registers: [registry],
  });

  new client.Gauge({
    name: 'crm_users_total',
    help: 'Total number of registered CRM users by role',
    labelNames: ['role'],
    registers: [registry],
  });

  new client.Gauge({
    name: 'crm_proposals_total',
    help: 'Total number of generated business proposals',
    registers: [registry],
  });

  new client.Gauge({
    name: 'crm_reminders_total',
    help: 'Total number of follow-up reminders by status and type',
    labelNames: ['status', 'type'],
    registers: [registry],
  });

  return registry;
}

export const registry =
  globalForMetrics.metricsRegistry ??
  (globalForMetrics.metricsRegistry = createRegistry());

/**
 * Dynamically fetch current CRM state from Prisma and update Prometheus Gauge metrics.
 * Ensures the exported Prometheus metric payload always reports high-fidelity and fresh values.
 */
export async function updateDynamicBusinessMetrics() {
  try {
    // 1. Leads and Deal Value Aggregations
    const leads = await prisma.lead.findMany({
      select: {
        stage: true,
        priority: true,
        subStatus: true,
        dealValueInr: true,
      }
    });

    const leadsGauge = registry.getSingleMetric('crm_leads_total') as client.Gauge<string>;
    const dealValueGauge = registry.getSingleMetric('crm_deal_value_inr_total') as client.Gauge<string>;
    
    leadsGauge.reset();
    dealValueGauge.reset();

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
    const usersGauge = registry.getSingleMetric('crm_users_total') as client.Gauge<string>;
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
    const proposalsGauge = registry.getSingleMetric('crm_proposals_total') as client.Gauge<string>;
    proposalsGauge.set(proposalsCount);

    // 4. Reminders count by status and type
    const reminders = await prisma.reminder.findMany({
      select: { status: true, type: true }
    });
    const remindersGauge = registry.getSingleMetric('crm_reminders_total') as client.Gauge<string>;
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