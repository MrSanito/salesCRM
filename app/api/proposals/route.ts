import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { createAuditLog } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET — list all proposals for a lead
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const proposals = await prisma.proposal.findMany({
      where: {
        leadId,
        organizationId: user.organizationId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, initials: true }
        }
      }
    });

    return NextResponse.json(proposals, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — delete a proposal and destroy its Cloudinary asset
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, name: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Proposal ID is required" }, { status: 400 });
    }

    const proposal = await prisma.proposal.findFirst({
      where: { id, organizationId: user.organizationId }
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Destroy Cloudinary asset
    if (proposal.cloudinaryPublicId) {
      console.log(`Destroying Cloudinary asset: ${proposal.cloudinaryPublicId}`);
      try {
        await cloudinary.uploader.destroy(proposal.cloudinaryPublicId, {
          resource_type: "raw"
        });
      } catch (cloudinaryError) {
        console.error("Cloudinary destroy error (ignored to proceed with database deletion):", cloudinaryError);
      }
    }

    // Delete record from database
    await prisma.proposal.delete({
      where: { id }
    });

    // Create Audit Log
    await createAuditLog({
      organizationId: user.organizationId,
      actorType: "USER",
      actorId: user.id,
      actorName: user.name,
      action: "DELETE_PROPOSAL",
      note: `Permanently deleted proposal for ${proposal.clientCompanyName}.`,
      source: "UI",
    });

    return NextResponse.json({ message: "Proposal deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
