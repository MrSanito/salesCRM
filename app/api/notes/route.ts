import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

// GET /api/notes?leadId=xxx  — fetch notes for a lead
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const leadId = req.nextUrl.searchParams.get("leadId");
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

    const notes = await prisma.note.findMany({
      where: { leadId, organizationId: user.organizationId },
      include: { user: { select: { name: true, initials: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Notes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST /api/notes  — save a new note
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { leadId, content } = await req.json();
    if (!leadId || !content?.trim()) {
      return NextResponse.json({ error: "leadId and content required" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        leadId,
        userId: decoded.userId,
        organizationId: user.organizationId,
        content: content.trim(),
      },
      include: { user: { select: { name: true, initials: true, role: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Notes POST error:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
