import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, name: true, role: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const response = await prisma.$transaction(async (tx) => {
      // Check if note exists and belongs to the organization
      const existingNote = await tx.note.findUnique({
        where: { id },
        select: { id: true, content: true, leadId: true, userId: true, organizationId: true }
      });

      if (!existingNote || existingNote.organizationId !== user.organizationId) {
        return { error: "Note not found", status: 404 };
      }

      const isSuperAdmin = user.email === "sb.solobuild@gmail.com";

      // Authorization check: User can edit their own notes, or super admin can edit any note
      if (existingNote.userId !== user.id && !isSuperAdmin) {
        return { error: "Forbidden", status: 403 };
      }

      const note = await tx.note.update({
        where: { id },
        data: { content: content.trim() },
        include: { user: { select: { name: true, initials: true, role: true } } },
      });

      // Create Audit Log inside transaction
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          leadId: existingNote.leadId,
          actorType: "USER",
          actorId: user.id,
          actorName: user.name || "Unknown User",
          action: "UPDATE_NOTE",
          field: "content",
          beforeValue: existingNote.content,
          afterValue: content,
          note: `Updated intelligence note: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          source: "UI",
        }
      });

      return { note };
    });

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: response.status });
    }

    return NextResponse.json(response.note);
  } catch (error) {
    console.error("Note PATCH error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, name: true, role: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;

    const response = await prisma.$transaction(async (tx) => {
      const existingNote = await tx.note.findUnique({
        where: { id }
      });

      if (!existingNote || existingNote.organizationId !== user.organizationId) {
        return { error: "Note not found", status: 404 };
      }

      const isSuperAdmin = user.email === "sb.solobuild@gmail.com";

      // Authorization check: User can delete their own notes, or super admin can delete any note
      if (existingNote.userId !== user.id && !isSuperAdmin) {
        return { error: "Forbidden", status: 403 };
      }

      await tx.note.delete({
        where: { id }
      });

      // Create Audit Log inside transaction
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          leadId: existingNote.leadId,
          actorType: "USER",
          actorId: user.id,
          actorName: user.name || "Unknown User",
          action: "DELETE_NOTE",
          note: `Deleted an intelligence note from the lead dossier.`,
          source: "UI",
        }
      });

      return { success: true };
    });

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Note DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
