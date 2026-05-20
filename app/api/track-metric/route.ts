import { NextResponse } from 'next/server';
import { registry } from '@/lib/metrics';
import client from 'prom-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const metricsToProcess = body.metrics ? body.metrics : [body];

    // Fetch custom metrics from register
    const httpRequestsTotal = registry.getSingleMetric('http_requests_total') as client.Counter<string>;
    const httpRequestDurationSeconds = registry.getSingleMetric('http_request_duration_seconds') as client.Histogram<string>;

    for (const metric of metricsToProcess) {
      const { path, method, duration, status } = metric;
      
      if (httpRequestsTotal) {
        httpRequestsTotal.inc({
          method: method || 'GET',
          path: path || '/',
          status: String(status || '200'),
        });
      }

      if (httpRequestDurationSeconds && typeof duration === 'number') {
        httpRequestDurationSeconds.observe({
          method: method || 'GET',
          path: path || '/',
          status: String(status || '200'),
        }, duration);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to log custom telemetry:', err.message);
    return NextResponse.json({ error: 'Failed to track metric' }, { status: 500 });
  }
}
