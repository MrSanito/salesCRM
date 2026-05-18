import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const start = Date.now();
  const res = NextResponse.next();

  const path = req.nextUrl.pathname;

  // CRITICAL: Prevent infinite recursive loops by excluding internal metrics endpoints, static files, and icons!
  if (
    path.startsWith('/api/track-metric') ||
    path.startsWith('/api/metrics') ||
    path.startsWith('/_next') ||
    path.includes('.')
  ) {
    return res;
  }

  // Log to metrics endpoint via internal fetch asynchronously
  const duration = (Date.now() - start) / 1000;
  const status = res.status ? res.status.toString() : '200';

  fetch(`${req.nextUrl.origin}/api/track-metric`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      method: req.method,
      duration,
      status,
    }),
  }).catch((err) => {
    // Catch asynchronously to prevent any middleware execution block on client requests
    console.error('Metrics tracking failed in middleware:', err.message);
  });

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files, media, and images
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
