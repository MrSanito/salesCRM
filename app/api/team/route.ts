import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().substring(0, 4);
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, name: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // If userId is provided, fetch detailed stats for this specific user
    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId, organizationId: currentUser.organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          initials: true,
          managerId: true,
          createdAt: true,
          manager: {
            select: { id: true, name: true }
          }
        }
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const [
        totalLeads,
        stageBreakdown,
        priorityBreakdown,
        dealValueStats,
        recentActivity
      ] = await Promise.all([
        // 1. Total leads count
        prisma.lead.count({
          where: { ownerId: userId, organizationId: currentUser.organizationId }
        }),
        // 2. Leads stage breakdown
        prisma.lead.groupBy({
          by: ['stage'],
          where: { ownerId: userId, organizationId: currentUser.organizationId },
          _count: { stage: true }
        }),
        // 3. Leads priority breakdown
        prisma.lead.groupBy({
          by: ['priority'],
          where: { ownerId: userId, organizationId: currentUser.organizationId },
          _count: { priority: true }
        }),
        // 4. Deal value aggregation
        prisma.lead.aggregate({
          where: { ownerId: userId, organizationId: currentUser.organizationId },
          _sum: { dealValueInr: true },
          _avg: { dealValueInr: true }
        }),
        // 5. Recent audit logs for this user's actions
        prisma.auditLog.findMany({
          where: { actorId: userId, organizationId: currentUser.organizationId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            action: true,
            field: true,
            beforeValue: true,
            afterValue: true,
            createdAt: true
          }
        })
      ]);

      return NextResponse.json({
        user: targetUser,
        stats: {
          totalLeads,
          stageBreakdown: stageBreakdown.map(item => ({ stage: item.stage, count: item._count.stage })),
          priorityBreakdown: priorityBreakdown.map(item => ({ priority: item.priority, count: item._count.priority })),
          totalValue: Number(dealValueStats._sum.dealValueInr || 0),
          avgValue: Number(dealValueStats._avg.dealValueInr || 0),
          recentActivity
        }
      });
    }

    // Otherwise, fetch all users in the organization
    const users = await prisma.user.findMany({
      where: {
        organizationId: currentUser.organizationId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        initials: true,
        managerId: true,
        _count: {
          select: { ownedLeads: true }
        }
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(users, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Error fetching team/user stats:", error);
    return NextResponse.json({ error: "Failed to fetch team data" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true, name: true }
    });

    // Check authorization: Must be Manager or Org Admin/CEO to update employee details
    if (!currentUser || (currentUser.role !== "ORG_ADMIN" && currentUser.role !== "CEO" && currentUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const body = await request.json();
    const { userId, name, email, role, managerId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch existing user to audit differences
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, organizationId: currentUser.organizationId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name && name !== existingUser.name) {
      updateData.name = name;
      updateData.initials = getInitials(name);
    }
    if (email && email !== existingUser.email) {
      updateData.email = email;
    }
    if (role && role !== existingUser.role) {
      // Validate role enum
      if (!Object.values(Role).includes(role as Role)) {
        return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
      }
      updateData.role = role as Role;
    }
    
    // Manage reporting manager hierarchy
    if (managerId !== undefined) {
      if (managerId === "") {
        updateData.managerId = null;
      } else {
        // Prevent setting themselves as their own manager
        if (managerId === userId) {
          return NextResponse.json({ error: "A user cannot report to themselves" }, { status: 400 });
        }
        updateData.managerId = managerId;
      }
    }

    // Perform database transaction or simple update
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          initials: true,
          managerId: true
        }
      });

      // Log changes to audit logs
      const logDetails = [];
      if (updateData.name) logDetails.push(`Name changed to: ${updateData.name}`);
      if (updateData.email) logDetails.push(`Email changed to: ${updateData.email}`);
      if (updateData.role) logDetails.push(`Role changed from ${existingUser.role} to ${updateData.role}`);
      if (updateData.managerId !== undefined) {
        logDetails.push(`Reporting manager updated`);
      }

      await tx.auditLog.create({
        data: {
          organizationId: currentUser.organizationId,
          actorType: "USER",
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: "UPDATE_USER",
          note: `Updated user profile ${existingUser.name}. Changes: ${logDetails.join(", ")}`,
          source: "UI"
        }
      });

      return user;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating team user:", error);
    return NextResponse.json({ error: "Failed to update team member details" }, { status: 500 });
  }
}
