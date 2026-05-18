import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Lightweight middleware — only pass-through routing.
  // Telemetry is handled by withRouteTelemetry() inside API routes for accurate data.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match API and page routes, skip all static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
