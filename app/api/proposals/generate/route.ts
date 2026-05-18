import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { v2 as cloudinary } from "cloudinary";
import { createAuditLog } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const contentTypeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/markup-compatibility/2006">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="240" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="48"/>
          <w:color w:val="6366F1"/>
        </w:rPr>
        <w:t>SOLOBUILD CRM PROPOSAL</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="720"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="28"/>
          <w:color w:val="475569"/>
        </w:rPr>
        <w:t>Custom CRM &amp; Workflow Automation Solution</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>1. Proposal Overview</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Client Company : </w:t></w:r>
      <w:r><w:t>{client_company_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Date : </w:t></w:r>
      <w:r><w:t>{proposal_date}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Contact Person : </w:t></w:r>
      <w:r><w:t>{contact_person}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Industry : </w:t></w:r>
      <w:r><w:t>{industry}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Team Size : </w:t></w:r>
      <w:r><w:t>{team_size}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Business Model : </w:t></w:r>
      <w:r><w:t>{business_model}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Current Tooling : </w:t></w:r>
      <w:r><w:t>{current_tools}</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>2. Operational Challenges</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{pain_points}</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>3. Strategic Desired Outcomes</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{desired_outcomes}</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>4. Scope of Work (Selected Modules)</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{scope_of_work}</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>5. Intelligent Workflow Automations</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{recommended_automations}</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>6. Commercial Terms &amp; Package Details</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Recommended Package : </w:t></w:r>
      <w:r><w:t>{package_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Deployment Timeline : </w:t></w:r>
      <w:r><w:t>{deployment_timeline}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Investment : </w:t></w:r>
      <w:r><w:t>{pricing}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Addons Requested : </w:t></w:r>
      <w:r><w:t>{addons}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">Hypercare Support : </w:t></w:r>
      <w:r><w:t>{support_duration}</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="480" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="475569"/>
        </w:rPr>
        <w:t>Prepared by SoloBuild. This proposal is valid for 30 days.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

export async function POST(req: Request) {
  try {
    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      leadId,
      client_company_name,
      proposal_date,
      industry,
      contact_person,
      team_size,
      current_tools,
      business_model,
      pain_points,
      desired_outcomes,
      scope_of_work,
      recommended_automations,
      deployment_timeline,
      package_name,
      pricing,
      addons,
      support_duration,
    } = body;

    if (!leadId || !client_company_name || !contact_person) {
      return NextResponse.json({ error: "Missing required fields (leadId, client_company_name, contact_person)" }, { status: 400 });
    }

    // Verify lead belongs to same organization
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: user.organizationId }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found in your organization" }, { status: 404 });
    }

    // Create the PizZip instance with minimal docx skeleton
    const zip = new PizZip();
    zip.file("[Content_Types].xml", contentTypeXml);
    zip.file("_rels/.rels", relsXml);
    zip.file("word/document.xml", documentXml);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render variables
    doc.render({
      client_company_name: client_company_name || "",
      proposal_date: proposal_date || "",
      industry: industry || "",
      contact_person: contact_person || "",
      team_size: team_size || "",
      current_tools: current_tools || "",
      business_model: business_model || "",
      pain_points: pain_points || "",
      desired_outcomes: desired_outcomes || "",
      scope_of_work: scope_of_work || "",
      recommended_automations: recommended_automations || "",
      deployment_timeline: deployment_timeline || "",
      package_name: package_name || "",
      pricing: pricing || "",
      addons: addons || "",
      support_duration: support_duration || "",
    });

    // Generate output zip buffer
    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Upload generated file to Cloudinary
    console.log("Uploading proposal to Cloudinary...");
    const cloudinaryResponse = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "proposals",
          public_id: `proposal_${leadId}_${Date.now()}`,
          format: "docx",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const fileUrl = cloudinaryResponse.secure_url;
    const publicId = cloudinaryResponse.public_id;

    // Create Proposal Record in Database
    const proposal = await prisma.proposal.create({
      data: {
        clientCompanyName: client_company_name,
        proposalDate: proposal_date,
        industry,
        contactPerson: contact_person,
        teamSize: team_size,
        currentTools: current_tools,
        businessModel: business_model,
        painPoints: pain_points,
        desiredOutcomes: desired_outcomes,
        scopeOfWork: scope_of_work,
        recommendedAutomations: recommended_automations,
        deploymentTimeline: deployment_timeline,
        packageName: package_name,
        pricing,
        addons,
        supportDuration: support_duration,
        fileUrl,
        cloudinaryPublicId: publicId,
        leadId,
        createdById: user.id,
        organizationId: user.organizationId,
      }
    });

    // Create Audit Log
    await createAuditLog({
      organizationId: user.organizationId,
      actorType: "USER",
      actorId: user.id,
      actorName: user.name,
      action: "CREATE_PROPOSAL",
      note: `Generated a custom integration proposal for ${client_company_name}.`,
      source: "UI",
    });

    return NextResponse.json({
      message: "Proposal generated successfully",
      proposal,
      fileUrl,
    });

  } catch (error: any) {
    console.error("Proposal generator error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate proposal" }, { status: 500 });
  }
}
