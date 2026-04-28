import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET() {
  return NextResponse.json({ message: "Login API is alive. Use POST to authenticate." });
}

export async function POST(req: Request) {
  console.log(">>> [DEBUG] LOGIN HANDLER STARTING <<<");
  try {
    const body = await req.json();
    console.log(">>> [DEBUG] Body parsed:", body.email);
    const { email, password } = body;

    if (!email || !password) {
      console.log(">>> [DEBUG] Missing fields");
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let user = null;
    let attempts = 0;
    while (attempts < 3) {
      try {
        console.log(`>>> [DEBUG] DB Attempt ${attempts + 1}`);
        user = await prisma.user.findUnique({
          where: { email },
        });
        break;
      } catch (err: any) {
        attempts++;
        console.error(`[Login] Database attempt ${attempts} failed: ${err.message}`);
        if (attempts >= 3) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (!user) {
      console.log(">>> [DEBUG] User not found");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(">>> [DEBUG] Password invalid");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json(
      { 
        message: "Login successful", 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          organizationId: user.organizationId 
        } 
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    console.log(">>> [DEBUG] Login successful, returning 200");
    return response;
  } catch (error: any) {
    console.error(">>> [DEBUG] LOGIN HANDLER CRASHED <<<", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
