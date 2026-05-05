import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { name, email, password, initials, role, organizationName, organizationId, managerId } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organization and user in a transaction
    console.log("Starting registration transaction...");
    const result = await prisma.$transaction(async (tx) => {
      let targetOrgId = organizationId;

      // 1. If no organizationId is provided, create a new one (First-time Org Signup)
      if (!targetOrgId) {
        if (!organizationName) {
          throw new Error("Organization name is required for new accounts");
        }
        
        const org = await tx.organization.create({
          data: {
            name: organizationName,
            slug: organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          },
        });
        targetOrgId = org.id;
      }

      // 2. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          initials: initials || name.split(' ').map((n: string) => n[0]).join('').substring(0, 4).toUpperCase() || "UN",
          role: role || (organizationId ? "SALES_REP" : "ORG_ADMIN"),
          organizationId: targetOrgId,
          managerId: managerId || null,
        },
      });

      // Create Audit Log for new user
      await createAuditLog({
        organizationId: targetOrgId!,
        actorType: "USER",
        actorId: user.id,
        actorName: user.name,
        action: "USER_SIGNUP",
        note: `New account protocol initialized for ${user.name} (${user.role}).`,
        source: "UI",
      });

      return { user };
    });

    return NextResponse.json({ message: "User created successfully", userId: result.user.id }, { status: 201 });
  } catch (error: any) {
    console.error("Register error detailed:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
