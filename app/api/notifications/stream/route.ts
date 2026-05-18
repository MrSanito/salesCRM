export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { addClient, removeClient } from "@/lib/sse-registry";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    console.log("[SSE Route] ❌ Connection failed: No token found in cookies");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    console.log("[SSE Route] ❌ Connection failed: JWT Verification failed", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userId = decoded.userId;
  console.log(`[SSE Route] ✅ Connection attempt: User ${userId}`);

  const encoder = new TextEncoder();
  let streamController: ReadableStreamDefaultController;
  let heartbeatInterval: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      streamController = controller;
      addClient(userId, controller);

      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch (e) {
          clearInterval(heartbeatInterval);
        }
      }, 25000);

      // Fetch unread alerts and enqueue
      try {
        const unreadAlerts = await prisma.alert.findMany({
          where: {
            userId: userId,
            isRead: false,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          },
          include: { lead: { select: { contactName: true } } },
          orderBy: { createdAt: "desc" },
          take: 25
        });

        if (unreadAlerts.length > 0) {
          const payload = unreadAlerts.map(alert => ({
            id: alert.id,
            type: alert.type,
            title: alert.title,
            body: alert.body,
            leadId: alert.leadId,
            contactName: alert.lead?.contactName,
            createdAt: alert.createdAt
          }));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        }
      } catch (err) {
        console.error("Error fetching unread alerts for SSE", err);
      }
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (streamController) removeClient(userId, streamController);
    }
  });

  req.signal.addEventListener("abort", () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (streamController) {
      removeClient(userId, streamController);
      try {
        streamController.close();
      } catch (e) {}
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
