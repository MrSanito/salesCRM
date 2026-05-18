import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  console.log(">>> [DEBUG] /api/auth/email-login POST received");
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find User by email in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      console.log(`>>> [DEBUG] User not found: ${normalizedEmail}`);
      return NextResponse.json({ error: "Email is not registered in Solo Sales" }, { status: 404 });
    }

    // 2. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    console.log(`>>> [DEBUG] Generated OTP for ${normalizedEmail}: ${otpCode}`);

    // 3. Upsert to Otp table
    await prisma.otp.upsert({
      where: { email: normalizedEmail },
      update: { code: otpCode, expiresAt },
      create: { email: normalizedEmail, code: otpCode, expiresAt }
    });

    // 4. Send Email via nodemailer
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Solo Sales Portal" <${process.env.SMTP_EMAIL}>`,
        to: normalizedEmail,
        subject: "Your Solo Sales Login OTP Verification Code",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px; color: #1e293b;">
            <div style="max-width: 500px; margin: 0 auto; bg-color: #ffffff; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); padding: 40px; border: 1px solid #e2e8f0; background: #ffffff;">
              <h2 style="font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; color: #0f172a; margin-bottom: 24px; text-align: center;">
                Solo <span style="color: #2563eb;">Sales</span>
              </h2>
              <p style="font-size: 14px; font-weight: 500; color: #64748b; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                Use the verification code below to complete your login session. This code is valid for 5 minutes.
              </p>
              <div style="background-color: #f1f5f9; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #0f172a; font-family: monospace;">${otpCode}</span>
              </div>
              <p style="font-size: 11px; text-align: center; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                If you did not request this code, please ignore this email.
              </p>
            </div>
          </div>
        `,
      });
      console.log(">>> [DEBUG] OTP email sent successfully");
    } catch (mailError: any) {
      console.error(">>> [DEBUG] Email failed to send:", mailError);
      return NextResponse.json({ error: "Failed to send email. Check SMTP settings." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully", otpSent: true });
  } catch (error: any) {
    console.error(">>> [DEBUG] Error in /api/auth/email-login:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
