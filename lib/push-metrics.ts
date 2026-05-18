// lib/push-metrics.ts
import { registry } from './metrics';

export async function pushMetricsToGrafana() {
  const url = process.env.GRAFANA_REMOTE_WRITE_URL;
  const username = process.env.GRAFANA_USERNAME;
  const apiKey = process.env.GRAFANA_API_KEY;

  if (!url) {
    throw new Error('GRAFANA_REMOTE_WRITE_URL is missing in environment variables');
  }
  if (!username) {
    throw new Error('GRAFANA_USERNAME is missing in environment variables');
  }
  if (!apiKey) {
    throw new Error('GRAFANA_API_KEY is missing in environment variables');
  }

  const metrics = await registry.metrics();
  const authString = btoa(`${username}:${apiKey}`);

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: `Basic ${authString}`,
    },
    body: metrics,
  });
}