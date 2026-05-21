import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import { v2 as cloudinary } from "cloudinary";
import { createAuditLog } from "@/lib/audit";
import fs from "fs";
import path from "path";

// PDFKit font loading patch for Next.js Standalone and Serverless environments.
// This redirects standard PDF font metrics requests (.afm files) to the project's public/fonts directory,
// which is guaranteed to be bundled and copied in all environments (including Vercel and output: standalone).
if (typeof window === "undefined") {
  const originalReadFileSync = fs.readFileSync;
  fs.readFileSync = function (filePath: any, options: any) {
    if (typeof filePath === "string" && filePath.endsWith(".afm")) {
      const fileName = path.basename(filePath);
      const localPath = path.join(process.cwd(), "public", "fonts", fileName);
      try {
        return originalReadFileSync(localPath, options);
      } catch (err) {
        console.error(`Failed to load patched font file ${fileName} from ${localPath}:`, err);
      }
    }
    return originalReadFileSync(filePath, options);
  } as any;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const stageLabels: Record<string, string> = {
  NEW: "New Lead",
  CONTACTED: "Contacted",
  NOT_INTERESTED: "Not Interested",
  MEETING_SET: "Meeting Set",
  NEGOTIATION: "Negotiation",
  COLD: "Cold Lead",
  CHATTING: "Chatting",
  CLIENT: "Client",
  WON: "Won Deal"
};

function drawTableRow(doc: any, cols: string[], x: number, y: number, colWidths: number[], isHeader = false) {
  let curX = x;
  if (isHeader) {
    // Fill header row background
    doc.rect(x - 5, y - 5, colWidths.reduce((a, b) => a + b, 0) + 10, 20).fill("#4F46E5");
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
  } else {
    doc.fillColor("#334155").font("Helvetica").fontSize(9);
  }
  
  for (let i = 0; i < cols.length; i++) {
    doc.text(cols[i], curX, y, { 
      width: colWidths[i], 
      align: i === 0 ? "left" : "right" 
    });
    curX += colWidths[i];
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth & Role Verification
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role check - Only CEO, ORG_ADMIN, and MANAGER are permitted to generate reports
    if (user.role !== "CEO" && user.role !== "ORG_ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Access denied. Insufficient permissions to generate performance reports." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { scope, employeeId } = body;

    if (!scope || (scope === "employee" && !employeeId)) {
      return NextResponse.json({ error: "Missing required fields (scope, employeeId)" }, { status: 400 });
    }

    // Security Constraint for MANAGER role:
    // - Managers can only generate reports for scope "employee".
    // - The employeeId must be themselves or their direct subordinates in the organization.
    if (user.role === "MANAGER") {
      if (scope !== "employee") {
        return NextResponse.json(
          { error: "Access denied. Managers can only generate specific employee performance reports." },
          { status: 403 }
        );
      }
      if (employeeId !== user.id) {
        const isSubordinate = await prisma.user.findFirst({
          where: { id: employeeId, managerId: user.id }
        });
        if (!isSubordinate) {
          return NextResponse.json(
            { error: "Access denied. You can only generate reports for yourself or your direct subordinates." },
            { status: 403 }
          );
        }
      }
    }

    // 2. Fetch Employee Detail if scope is employee
    let employeeName = "";
    if (scope === "employee" && employeeId) {
      const employee = await prisma.user.findFirst({
        where: { id: employeeId, organizationId: user.organizationId }
      });
      if (!employee) {
        return NextResponse.json({ error: "Selected employee not found in your organization" }, { status: 404 });
      }
      employeeName = employee.name;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true }
    });
    const userOrgName = organization?.name || "SoloBuild CRM Client";

    // 3. Gather CRM Metrics Data
    const filterWhere: any = { organizationId: user.organizationId };
    if (scope === "employee" && employeeId) {
      filterWhere.ownerId = employeeId;
    }

    const [
      totalLeads,
      stageCounts,
      dealValueAgg,
      totalInteractions,
      interactionsByType,
      leadsBySource,
      recentInteractions,
    ] = await Promise.all([
      // Total leads count
      prisma.lead.count({ where: filterWhere }),
      // Leads grouped by stage
      prisma.lead.groupBy({
        by: ["stage"],
        where: filterWhere,
        _count: { stage: true }
      }),
      // Deal value aggregations
      prisma.lead.aggregate({
        where: filterWhere,
        _sum: { dealValueInr: true },
        _avg: { dealValueInr: true },
        _max: { dealValueInr: true }
      }),
      // Total interactions count
      prisma.interaction.count({
        where: {
          organizationId: user.organizationId,
          ...(scope === "employee" && employeeId ? { userId: employeeId } : {})
        }
      }),
      // Interactions grouped by type
      prisma.interaction.groupBy({
        by: ["type"],
        where: {
          organizationId: user.organizationId,
          ...(scope === "employee" && employeeId ? { userId: employeeId } : {})
        },
        _count: { type: true }
      }),
      // Lead counts by source
      prisma.lead.groupBy({
        by: ["sourceId"],
        where: filterWhere,
        _count: { id: true }
      }),
      // Sample of recent activities for analytical context
      prisma.interaction.findMany({
        where: {
          organizationId: user.organizationId,
          ...(scope === "employee" && employeeId ? { userId: employeeId } : {})
        },
        orderBy: { occurredAt: "desc" },
        take: 12,
        include: {
          lead: { select: { contactName: true, company: true } },
          user: { select: { name: true } }
        }
      })
    ]);

    // Fetch Source Names to Map Source IDs
    const sourcesList = await prisma.leadSource.findMany({
      where: { organizationId: user.organizationId }
    });
    const sourceMap = new Map(sourcesList.map(s => [s.id, s.name]));

    // Construct full pipeline funnel array including empty stages
    const allStages = ["NEW", "CONTACTED", "CHATTING", "MEETING_SET", "NEGOTIATION", "WON", "CLIENT", "COLD", "NOT_INTERESTED"];
    const funnelList = allStages.map(stage => {
      const match = stageCounts.find(s => s.stage === stage);
      return {
        key: stage,
        label: stageLabels[stage] || stage,
        count: match ? match._count.stage : 0
      };
    });

    // 4. Request Analysis from Gemini 2.5 Flash using JSON schema output
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured in environment variables");
      return NextResponse.json({ error: "AI Service not configured" }, { status: 501 });
    }

    const reportPrompt = `You are a Senior Business Intelligence and CRM Performance Analyst.
Review the following CRM performance metrics and generate a comprehensive performance analysis report.

Context:
- Organization Name: "${userOrgName}"
- Report Scope: ${scope === "employee" ? `Specific Employee (${employeeName})` : "Whole CRM"}
- Generated By: ${user.name} (${user.role})
- Date: ${new Date().toLocaleDateString("en-IN")}

Core Metrics Data:
1. Leads:
   - Total Leads: ${totalLeads}
   - Leads by Stage: ${JSON.stringify(stageCounts)}
   - Total Pipeline Value (INR): ${dealValueAgg._sum.dealValueInr || 0}
   - Average Deal Value (INR): ${dealValueAgg._avg.dealValueInr || 0}
   - Maximum Deal Value (INR): ${dealValueAgg._max.dealValueInr || 0}

2. Activities & Interactions:
   - Total Interactions: ${totalInteractions}
   - Interactions by Type: ${JSON.stringify(interactionsByType)}
   - Top Lead Sources: ${JSON.stringify(leadsBySource.map(s => ({ name: (s.sourceId && sourceMap.get(s.sourceId)) || "Unknown", count: s._count.id })))}

3. Recent Activity Feed (Sample):
${recentInteractions.map(i => `- [${i.occurredAt.toLocaleDateString("en-IN")}] ${i.user.name} had a ${i.type} interaction with ${i.lead.contactName} (${i.lead.company}): "${i.summary || "No summary"}"`).join("\n")}

Analyze this data and produce a structured analytical performance report. Be precise, metrics-driven, and provide deep strategic insights. Recommend next actions based on the low or high counts of won leads, pending follow ups, or interaction types. Do not use generic placeholders. Ensure your text flow is smooth and highly professional.`;

    console.log("Calling Gemini Flash for report analysis...");
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey
        },
        cache: "no-store",
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: reportPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                subtitle: { type: "STRING" },
                executiveSummary: { type: "STRING" },
                keyFindings: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                metricsNarrative: { type: "STRING" },
                activityNarrative: { type: "STRING" },
                strategicStrengths: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                improvementAreas: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                actionItems: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      description: { type: "STRING" },
                      priority: { type: "STRING" }
                    },
                    required: ["title", "description", "priority"]
                  }
                }
              },
              required: [
                "title",
                "subtitle",
                "executiveSummary",
                "keyFindings",
                "metricsNarrative",
                "activityNarrative",
                "strategicStrengths",
                "improvementAreas",
                "actionItems"
              ]
            }
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API Error:", errText);
      return NextResponse.json({ error: "Failed to generate report text using Gemini API" }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const rawAiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawAiText) {
      return NextResponse.json({ error: "AI analysis response was empty" }, { status: 500 });
    }

    const aiData = JSON.parse(rawAiText);

    // 5. Generate PDF using pdfkit
    console.log("Generating report PDF in memory...");
    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
    const chunks: any[] = [];
    doc.on("data", chunk => chunks.push(chunk));

    // Page 1: Header and Summary Cards
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(22).text(aiData.title || "CRM Performance Report", 50, 45);
    doc.fillColor("#4F46E5").font("Helvetica-Bold").fontSize(11).text(aiData.subtitle || "AI Analytics & Performance Audit", 50, 72);
    doc.moveTo(50, 90).lineTo(545.28, 90).strokeColor("#E2E8F0").lineWidth(1).stroke();

    // Metadata Card
    doc.roundedRect(50, 105, 495.28, 62, 6).fill("#F8FAFC");
    doc.fillColor("#475569").font("Helvetica").fontSize(9);
    doc.text("Organization:", 65, 115);
    doc.text("Report Scope:", 65, 130);
    doc.text("Generated By:", 65, 145);

    doc.fillColor("#0F172A").font("Helvetica-Bold");
    doc.text(userOrgName, 150, 115);
    doc.text(scope === "employee" ? `Specific Employee (${employeeName})` : "Whole CRM Database", 150, 130);
    doc.text(`${user.name} (${user.role})`, 150, 145);

    doc.fillColor("#475569").font("Helvetica");
    doc.text("Report Date:", 345, 115);
    doc.fillColor("#0F172A").font("Helvetica-Bold");
    doc.text(new Date().toLocaleDateString("en-IN"), 420, 115);

    // Key Metric Cards (4 cards in a row)
    const cardY = 185;
    const cardW = 115;
    const cardH = 55;
    const cardGap = 12;

    const formattedValue = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(dealValueAgg._sum.dealValueInr || 0));

    const metricsList = [
      { label: "Total Leads", value: String(totalLeads) },
      { label: "Pipeline Value", value: formattedValue },
      { label: "Interactions", value: String(totalInteractions) },
      { label: "Avg Deal Value", value: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(dealValueAgg._avg.dealValueInr || 0)) }
    ];

    metricsList.forEach((m, idx) => {
      const cardX = 50 + idx * (cardW + cardGap);
      doc.roundedRect(cardX, cardY, cardW, cardH, 5).fillAndStroke("#EEF2F6", "#E2E8F0");
      doc.fillColor("#475569").font("Helvetica").fontSize(8).text(m.label.toUpperCase(), cardX + 10, cardY + 10);
      doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(11).text(m.value, cardX + 10, cardY + 22, { width: cardW - 20 });
    });

    // Executive Summary
    let currentY = 265;
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(13).text("1. Executive Summary", 50, currentY);
    currentY += 18;
    doc.fillColor("#334155").font("Helvetica").fontSize(9.5).text(aiData.executiveSummary, 50, currentY, {
      width: 495.28,
      align: "justify",
      lineGap: 3
    });

    // Key Highlights / Findings
    currentY = doc.y + 20;
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(11).text("Key Insights & Performance Highlights", 50, currentY);
    currentY += 16;
    for (const finding of aiData.keyFindings) {
      doc.circle(58, currentY + 5, 2.5).fill("#4F46E5");
      doc.fillColor("#334155").font("Helvetica").fontSize(9.5).text(finding, 70, currentY, { width: 475.28 });
      currentY = doc.y + 8;
    }

    // Page 2: Funnel Table and Funnel Narrative
    doc.addPage();
    currentY = 50;
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(13).text("2. CRM Funnel Distribution", 50, currentY);
    currentY += 18;

    // Header of Table
    drawTableRow(doc, ["Lead Stage", "Leads Count", "Conversion %"], 55, currentY, [200, 147, 148], true);
    currentY += 20;

    // Row loop
    const totalCountVal = totalLeads || 1;
    funnelList.forEach((stage) => {
      const percentage = ((stage.count / totalCountVal) * 100).toFixed(1) + "%";
      drawTableRow(doc, [stage.label, String(stage.count), percentage], 55, currentY, [200, 147, 148], false);
      
      // Draw grid line
      doc.moveTo(50, currentY + 14).lineTo(545.28, currentY + 14).strokeColor("#F1F5F9").lineWidth(0.5).stroke();
      currentY += 18;
    });

    currentY += 10;
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(11).text("AI Pipeline Analysis", 50, currentY);
    currentY += 16;
    doc.fillColor("#334155").font("Helvetica").fontSize(9.5).text(aiData.metricsNarrative, 50, currentY, {
      width: 495.28,
      align: "justify",
      lineGap: 3
    });

    // Page 3: Activity & SWOT & Action Items
    doc.addPage();
    currentY = 50;
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(13).text("3. Sales Activity & SWOT Analysis", 50, currentY);
    currentY += 18;

    doc.fillColor("#334155").font("Helvetica").fontSize(9.5).text(aiData.activityNarrative, 50, currentY, {
      width: 495.28,
      align: "justify",
      lineGap: 3
    });
    currentY = doc.y + 20;

    // SWOT Columns
    const swotY = currentY;
    doc.fillColor("#10B981").font("Helvetica-Bold").fontSize(11).text("Strategic Strengths", 50, swotY);
    let leftY = swotY + 16;
    for (const strength of aiData.strategicStrengths) {
      doc.circle(55, leftY + 4, 2).fill("#10B981");
      doc.fillColor("#334155").font("Helvetica").fontSize(9).text(strength, 64, leftY, { width: 220 });
      leftY = doc.y + 7;
    }

    doc.fillColor("#EF4444").font("Helvetica-Bold").fontSize(11).text("Areas for Improvement", 305, swotY);
    let rightY = swotY + 16;
    for (const area of aiData.improvementAreas) {
      doc.circle(310, rightY + 4, 2).fill("#EF4444");
      doc.fillColor("#334155").font("Helvetica").fontSize(9).text(area, 319, rightY, { width: 220 });
      rightY = doc.y + 7;
    }

    currentY = Math.max(leftY, rightY) + 20;

    // Action Items
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(11).text("4. Recommended Action Plan", 50, currentY);
    currentY += 16;

    for (const item of aiData.actionItems) {
      // Priority Color badge
      let badgeCol = "#94A3B8";
      if (item.priority.toLowerCase() === "high") badgeCol = "#EF4444";
      else if (item.priority.toLowerCase() === "medium") badgeCol = "#F59E0B";
      else if (item.priority.toLowerCase() === "low") badgeCol = "#10B981";

      doc.roundedRect(50, currentY, 45, 12, 3).fill(badgeCol);
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(7).text(item.priority.toUpperCase(), 50, currentY + 2.5, { width: 45, align: "center" });

      doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(9.5).text(item.title, 105, currentY);
      doc.fillColor("#475569").font("Helvetica").fontSize(9).text(item.description, 105, currentY + 12, { width: 440 });
      
      currentY = doc.y + 10;
    }

    // Dynamic headers and footers across all generated pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Top header bar
      doc.rect(0, 0, 595.28, 15).fill("#4F46E5");
      
      // Bottom footer line
      doc.moveTo(50, 792).lineTo(545.28, 792).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
      doc.fillColor("#94A3B8").font("Helvetica").fontSize(7.5);
      doc.text("SoloBuild CRM Performance Analytics", 50, 802, { align: "left" });
      doc.text(`Page ${i + 1} of ${range.count}`, 50, 802, { align: "right", width: 495.28 });
    }

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", err => reject(err));
    });

    // 6. Upload Generated PDF Buffer to Cloudinary
    console.log("Uploading report to Cloudinary...");
    const cloudinaryResponse = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "performance_reports",
          public_id: `crm_report_${scope}_${employeeId || "all"}_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(pdfBuffer);
    });

    const fileUrl = cloudinaryResponse.secure_url;
    const publicId = cloudinaryResponse.public_id;

    // 7. Write Audit Log
    await createAuditLog({
      organizationId: user.organizationId,
      actorType: "USER",
      actorId: user.id,
      actorName: user.name,
      action: "GENERATE_REPORT",
      note: `Generated CRM Performance Report. Scope: ${scope === "employee" ? `Employee (${employeeName})` : "Whole CRM"}. Download URL: ${fileUrl}`,
      source: "UI",
    });

    console.log("Performance Report successfully generated and uploaded:", fileUrl);
    return NextResponse.json({
      success: true,
      message: "Performance report generated successfully",
      fileUrl,
      publicId
    });

  } catch (error: any) {
    console.error("Report generator API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
