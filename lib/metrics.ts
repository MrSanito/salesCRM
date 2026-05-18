import client from 'prom-client';

const globalForMetrics = global as typeof global & {
  metricsRegistry?: client.Registry;
};

function createRegistry() {
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });

  // Custom metrics
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

  return registry;
}

export const registry =
  globalForMetrics.metricsRegistry ??
  (globalForMetrics.metricsRegistry = createRegistry());