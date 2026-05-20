import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const start = Date.now();
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Process the request
  const response = NextResponse.next();

  // Exclude Next.js internals, static files, and telemetry endpoints to avoid loops
  if (
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api/track-metric') &&
    !pathname.startsWith('/api/metrics') &&
    !pathname.startsWith('/api/push-metrics') &&
    !pathname.includes('.')
  ) {
    const duration = (Date.now() - start) / 1000;
    
    const g = globalThis as any;
    if (!g.__metricsBatch) g.__metricsBatch = [];
    
    g.__metricsBatch.push({
      path: pathname,
      method: method,
      duration: duration > 0 ? duration : 0.01,
      status: '200',
    });

    if (!g.__batchPromise) {
      g.__batchPromise = new Promise((resolve) => {
        g.__resolveBatchPromise = resolve;
      });
      
      const trackUrl = new URL('/api/track-metric', req.url);

      g.__batchTimeout = setTimeout(() => {
        const payload = [...(g.__metricsBatch || [])];
        g.__metricsBatch = [];
        
        const resolveCurrent = g.__resolveBatchPromise;
        g.__batchPromise = null;
        g.__resolveBatchPromise = null;
        g.__batchTimeout = null;

        if (payload.length > 0) {
          fetch(trackUrl.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ metrics: payload }),
          })
          .then(() => resolveCurrent?.())
          .catch((err) => {
            console.error('Error tracking batched metrics in proxy:', err);
            resolveCurrent?.();
          });
        } else {
          resolveCurrent?.();
        }
      }, 500); // 500ms batch window
    }

    // Keep the edge context alive until the current active batch finishes
    if (g.__batchPromise) {
      event.waitUntil(g.__batchPromise);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Only match API and page routes, skip all static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
