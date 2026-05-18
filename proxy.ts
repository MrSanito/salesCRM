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
    
    // Resolve absolute URL for the local metrics tracking API
    const trackUrl = new URL('/api/track-metric', req.url);

    // Keep the edge context alive for the background telemetry call
    event.waitUntil(
      fetch(trackUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: pathname,
          method: method,
          duration: duration > 0 ? duration : 0.01,
          status: '200',
        }),
      }).catch((err) => {
        console.error('Error tracking metric in proxy:', err);
      })
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Only match API and page routes, skip all static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
