import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getGoogleCalendarEvents } from '@/lib/google';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    const events = await getGoogleCalendarEvents(userId);
    if (events === null) {
      return NextResponse.json({ error: "Google Calendar not synced or configured" }, { status: 400 });
    }

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Calendar GET API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST route to handle Google Calendar event creation and sync
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await req.json();
    const { summary, description, location, start, end } = body;

    if (!summary || !start || !end) {
      return NextResponse.json({ error: "summary, start, and end dates are required" }, { status: 400 });
    }

    const { syncToGoogleCalendar } = await import('@/lib/google');
    const result = await syncToGoogleCalendar(userId, {
      summary,
      description: description || "",
      location: location || "",
      start,
      end,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to create Google Calendar event. Ensure calendar sync is enabled." }, { status: 400 });
    }

    return NextResponse.json({ success: true, event: result }, { status: 201 });
  } catch (error: any) {
    console.error("Calendar POST API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
