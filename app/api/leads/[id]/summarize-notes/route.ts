import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function getAuthUser(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true, name: true },
    });
  } catch { return null; }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lead = await prisma.lead.findUnique({
      where: { id, organizationId: user.organizationId },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } }
        }
      }
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (!lead.notes || lead.notes.length === 0) {
      return NextResponse.json({ summary: "No notes to summarize." });
    }

    const notesText = lead.notes.map(n => `[${n.createdAt.toISOString()}] ${n.user?.name || 'Unknown'}: ${n.content}`).join("\n");

    const prompt = `Take this notes data and summarize it in 4 to 5 lines. Do not make it bigger.\n\nNotes Data:\n${notesText}`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured in environment variables");
      return NextResponse.json({ error: "AI Service not configured" }, { status: 501 });
    }

    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey
      },
      cache: "no-store",
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API Error:", errText);
      return NextResponse.json({ error: "Failed to summarize using Gemini API" }, { status: 500 });
    }

    const data = await geminiRes.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarize Notes Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
