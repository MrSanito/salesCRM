import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function POST(req: Request) {
  console.log(">>> [DEBUG] /api/auth/email-login/verify POST received");
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify OTP in Otp table
    const otpRecord = await prisma.otp.findUnique({
      where: { email: normalizedEmail }
    });

    if (!otpRecord || otpRecord.code !== otp || otpRecord.expiresAt < new Date()) {
      console.log(`>>> [DEBUG] Invalid or expired OTP for ${normalizedEmail}`);
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }

    // 2. Clear OTP record
    await prisma.otp.delete({
      where: { email: normalizedEmail }
    });

    // 3. Find User details
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // 4. Generate JWT Session Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({ 
      success: true,
      message: "Login successful", 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        organizationId: user.organizationId 
      }
    });

    // Set HTTP-only Cookie
    response.cookies.set("token", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax", 
      maxAge: 86400, // 1 day
      path: "/" 
    });

    console.log(`>>> [DEBUG] User ${normalizedEmail} successfully authenticated via OTP`);
    return response;
  } catch (error: any) {
    console.error(">>> [DEBUG] Error in /api/auth/email-login/verify:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
