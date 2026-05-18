import { NextResponse } from 'next/server';
import { registry } from '@/lib/metrics';
import { pushTimeseries } from 'prometheus-remote-write';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = req.headers.get('x-metrics-token');
  const authHeader = req.headers.get('authorization');
  const validSecret = process.env.CRON_SECRET || process.env.METRICS_SECRET;
  
  const isAuthorized = token === validSecret || authHeader === `Bearer ${validSecret}`;

  if (!isAuthorized) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const jsonMetrics = await registry.getMetricsAsJSON();
    const timeseries: any[] = [];

    for (const metric of jsonMetrics) {
      for (const val of metric.values) {
        timeseries.push({
          labels: {
            __name__: metric.name,
            ...(val.labels || {})
          },
          samples: [{ value: val.value }]
        });
      }
    }

    if (timeseries.length === 0) {
      return NextResponse.json({ ok: true, pushed: 0, message: 'No metrics to push' });
    }

    const result = await pushTimeseries(timeseries, {
      url: process.env.GRAFANA_REMOTE_WRITE_URL!,
      auth: {
        username: process.env.GRAFANA_USERNAME!,
        password: process.env.GRAFANA_API_KEY!,
      },
    });

    if (result && result.status >= 400) {
      throw new Error(`Grafana returned status ${result.status}: ${result.statusText}`);
    }

    return NextResponse.json({ ok: true, pushed: timeseries.length });
  } catch (err: any) {
    console.error('Metrics push failed:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
