import { NextResponse } from 'next/server';
import { pushMetricsToGrafana } from '@/lib/push-metrics';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const validSecret = process.env.CRON_SECRET || process.env.METRICS_SECRET;
  if (authHeader !== `Bearer ${validSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await pushMetricsToGrafana();
    return NextResponse.json({ success: true, message: 'Metrics pushed successfully to Grafana' });
  } catch (err: any) {
    console.error('Failed to push metrics to Grafana:', err.message);
    return NextResponse.json({ error: 'Failed to push metrics', details: err.message }, { status: 500 });
  }
}
