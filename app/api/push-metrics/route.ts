import { NextResponse } from 'next/server';
import { registry, updateDynamicBusinessMetrics } from '@/lib/metrics';
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
    // Refresh premium CRM metrics from the database
    await updateDynamicBusinessMetrics();

    const jsonMetrics = await registry.getMetricsAsJSON();
    const timeseries: any[] = [];
    const timestamp = Date.now(); // Standard practice: Millisecond timestamp representation

    for (const metric of jsonMetrics) {
      for (const val of metric.values) {
        const labels: Record<string, string> = {
          __name__: String(metric.name),
        };
        
        if (val.labels) {
          for (const [k, v] of Object.entries(val.labels)) {
            if (v !== undefined && v !== null) {
              labels[k] = String(v);
            }
          }
        }

        timeseries.push({
          labels,
          samples: [{ 
            value: Number(val.value) || 0,
            timestamp // High-fidelity millisecond timestamp for correct time alignment
          }]
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
