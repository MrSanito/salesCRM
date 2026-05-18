// app/api/metrics/route.ts  (App Router)
import { NextResponse } from 'next/server';
import { registry } from '@/lib/metrics';

// Protect this endpoint!
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.METRICS_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const metrics = await registry.metrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': registry.contentType },
  });
}