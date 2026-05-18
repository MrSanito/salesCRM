// lib/push-metrics.ts
import { registry } from './metrics';

export async function pushMetricsToGrafana() {
  const metrics = await registry.metrics();

  await fetch(process.env.GRAFANA_REMOTE_WRITE_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: `Basic ${Buffer.from(
        `${process.env.GRAFANA_USERNAME}:${process.env.GRAFANA_API_KEY}`
      ).toString('base64')}`,
    },
    body: metrics,
  });
}