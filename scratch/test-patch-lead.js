const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ 
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Find a lead
    const lead = await prisma.lead.findFirst({
      include: {
        owner: true
      }
    });

    if (!lead) {
      console.log("No leads found in database.");
      return;
    }

    console.log("Found Lead ID:", lead.id);
    console.log("Current Stage:", lead.stage);
    console.log("Current Sub-Status:", lead.subStatus);
    console.log("Lead Owner ID:", lead.ownerId);

    // Let's find a user who is ORG_ADMIN or MANAGER
    const user = await prisma.user.findFirst({
      where: {
        role: "ORG_ADMIN"
      }
    });

    if (!user) {
      console.log("No ORG_ADMIN user found.");
      return;
    }

    console.log("Simulating update by user:", user.email, "role:", user.role);

    // Simulate the exact patch data that would be sent
    const data = {
      stage: lead.stage === "NEW" ? "CONTACTED" : "NEW",
      subStatus: lead.subStatus === "BLANK" ? "CHATTING" : "BLANK",
      dealValueInr: 1000
    };

    const updateData = {
      ...(data.stage !== undefined && { stage: data.stage }),
      ...(data.subStatus !== undefined && { subStatus: data.subStatus }),
      ...(data.dealValueInr !== undefined && { dealValueInr: data.dealValueInr ? data.dealValueInr.toString().replace(/[^0-9.]/g, '') : "0" }),
    };

    const auditLogs = [];
    for (const [key, afterValue] of Object.entries(updateData)) {
      const beforeValue = lead[key];
      if (beforeValue?.toString() !== afterValue?.toString()) {
        auditLogs.push({
          organizationId: user.organizationId,
          leadId: lead.id,
          actorType: "USER",
          actorId: user.id,
          actorName: user.name || "Unknown",
          action: "UPDATE",
          field: key,
          beforeValue: beforeValue?.toString(),
          afterValue: afterValue?.toString(),
          note: `Updated protocol field '${key}' from '${beforeValue || "None"}' to '${afterValue || "None"}'.`,
          source: "UI",
        });
      }
    }

    console.log("Built Update Data:", updateData);
    console.log("Built Audit Logs:", auditLogs);

    // Try executing transaction
    console.log("Executing transaction...");
    const updatedLead = await prisma.$transaction(async (tx) => {
      // 1. Update lead
      const updated = await tx.lead.update({
        where: { id: lead.id },
        data: updateData
      });

      // 2. Create Audit Logs
      if (auditLogs.length > 0) {
        await tx.auditLog.createMany({
          data: auditLogs,
          skipDuplicates: true
        });
      }
      return updated;
    });

    console.log("Transaction Succeeded!");
    console.log("Updated Lead Stage:", updatedLead.stage);
    console.log("Updated Lead Sub-Status:", updatedLead.subStatus);

  } catch (err) {
    console.error("Transaction Failed with Error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
