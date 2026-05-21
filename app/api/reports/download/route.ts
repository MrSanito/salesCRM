import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET(req: NextRequest) {
  try {
    // 1. Auth & Verification to secure the endpoint
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse URL query parameter
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");
    if (!fileUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Security check: only allow res.cloudinary.com domains
    if (!fileUrl.startsWith("https://res.cloudinary.com/")) {
      return NextResponse.json({ error: "Invalid URL source" }, { status: 400 });
    }

    console.log(`[DownloadProxy] Streaming report for user ${user.id} from: ${fileUrl}`);

    // Fetch the raw PDF buffer from Cloudinary (which bypasses standard restricted .pdf extension block)
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error(`[DownloadProxy] Failed to fetch PDF from Cloudinary. Status: ${response.status}`);
      return NextResponse.json({ error: "Failed to retrieve report file" }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Serve the bytes directly as application/pdf to the browser
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"crm_report_performance.pdf\"",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error: any) {
    console.error("[DownloadProxy] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to download" }, { status: 500 });
  }
}
