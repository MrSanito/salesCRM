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

    // 1. Find User by email case-insensitively to determine exact DB casing (resilient to capitalizations like Gutsqureshi@gmail.com)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      console.log(`>>> [DEBUG] User record not found: ${normalizedEmail}`);
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // 2. Verify OTP in Otp table using the exact user.email casing
    const otpRecord = await prisma.otp.findUnique({
      where: { email: user.email }
    });

    if (!otpRecord || otpRecord.code !== otp || otpRecord.expiresAt < new Date()) {
      console.log(`>>> [DEBUG] Invalid or expired OTP for ${user.email}`);
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }

    // 3. Clear OTP record
    await prisma.otp.delete({
      where: { email: user.email }
    });

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
