// lib/push-metrics.ts
import { registry } from './metrics';

export async function pushMetricsToGrafana() {
  const metrics = await registry.metrics();

  const username = process.env.GRAFANA_USERNAME || '';
  const apiKey = process.env.GRAFANA_API_KEY || '';
  const authString = btoa(`${username}:${apiKey}`);

  await fetch(process.env.GRAFANA_REMOTE_WRITE_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: `Basic ${authString}`,
    },
    body: metrics,
  });
}