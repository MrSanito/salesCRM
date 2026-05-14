import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";
import { InteractionType } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { leadId, type, summary } = await req.json();

    if (!leadId || !type) {
      return NextResponse.json({ error: "leadId and type are required" }, { status: 400 });
    }



    // Verify lead existence and ownership
    const existingLead = await prisma.lead.findFirst({
      where: { 
        id: leadId,
        organizationId: user.organizationId
      }
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Update lead and create interaction in a transaction
    const [interaction, updatedLead] = await prisma.$transaction([
      prisma.interaction.create({
        data: {
          leadId,
          userId: user.id,
          organizationId: user.organizationId,
          type: type as InteractionType,
          summary: summary || null,
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: { lastCommunicatedAt: new Date() }
      })
    ]);



    // Create Audit Log
    let note = "";
    switch (type) {
      case "CALL":
        note = `Initiated a direct phone call protocol with the lead.`;
        break;
      case "EMAIL":
        note = `Sent a formal email communication to the lead's registered address.`;
        break;
      case "WHATSAPP":
        note = `Opened a secure WhatsApp chat session with the lead.`;
        break;
      default:
        note = `Logged a ${type.toLowerCase()} interaction with the lead.`;
    }

    // Fire-and-forget: don't block response for audit logging
    createAuditLog({
      organizationId: user.organizationId,
      leadId: leadId,
      actorType: "USER",
      actorId: user.id,
      actorName: user.name,
      action: `LOG_${type}`,
      note: note,
      source: "UI",
    }).catch(console.error);

    return NextResponse.json({ interaction, updatedLead }, { status: 201 });
  } catch (error) {
    console.error("Interaction POST error:", error);
    return NextResponse.json({ 
      error: "Failed to log interaction", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
