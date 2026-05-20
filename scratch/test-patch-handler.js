const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function testUserPatch(email, leadId, newStage, newSubStatus) {
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
    const user = await prisma.user.findUnique({
      where: { email },
      select: { organizationId: true, role: true, id: true, name: true, email: true },
    });
    if (!user) {
      console.log(`User ${email} not found.`);
      return;
    }

    console.log(`\nSimulating PATCH for Lead ${leadId} by User ${user.email} (Role: ${user.role}, ID: ${user.id})`);

    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
    const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO" || user.role === "MANAGER";

    const existingLead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: user.organizationId }
    });

    if (!existingLead) {
      console.log(`Lead not found or does not belong to user's org.`);
      return;
    }

    console.log(`Lead Owner ID: ${existingLead.ownerId}`);

    // Authorization check from the route
    if (!isSuperAdmin && !isOrgAdmin && existingLead.ownerId !== user.id) {
      console.log(`Forbidden (403) - Standard workers can only update their own leads`);
      return;
    }

    const data = { stage: newStage, subStatus: newSubStatus };

    const updateData = {
      ...(data.stage !== undefined && { stage: data.stage }),
      ...(data.subStatus !== undefined && { subStatus: data.subStatus }),
    };

    const auditLogs = [];
    
    const updatedLead = await prisma.$transaction(async (tx) => {
      // Scan for other standard field changes
      for (const [key, afterValue] of Object.entries(updateData)) {
        if (key === "sourceId" || key === "notes") continue;
        const beforeValue = existingLead[key];
        if (beforeValue?.toString() !== afterValue?.toString()) {
          auditLogs.push({
            organizationId: user.organizationId,
            leadId: leadId,
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

      console.log("Applying lead updates:", updateData);
      const updated = await tx.lead.update({
        where: { id: leadId },
        data: updateData,
        include: {
          owner: { select: { name: true, initials: true } },
        }
      });

      if (auditLogs.length > 0) {
        console.log("Creating audit logs:", auditLogs);
        await tx.auditLog.createMany({
          data: auditLogs,
          skipDuplicates: true
        });
      }

      return updated;
    });

    console.log("Patch Simulation Successful! Updated Lead Stage:", updatedLead.stage, "SubStatus:", updatedLead.subStatus);

  } catch (err) {
    console.error("Patch Simulation Failed:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  // Find a lead owned by sb.solobuild@gmail.com
  const leadAdmin = await prisma.lead.findFirst({
    where: { owner: { email: "sb.solobuild@gmail.com" } }
  });

  // Find a lead owned by solobuildworker@gmail.com
  const leadWorker = await prisma.lead.findFirst({
    where: { owner: { email: "solobuildworker@gmail.com" } }
  });

  await prisma.$disconnect();
  await pool.end();

  if (leadAdmin) {
    // 1. Test Admin updating Admin's lead
    await testUserPatch("sb.solobuild@gmail.com", leadAdmin.id, "CONTACTED", "CHATTING");
    // 2. Test Org Admin (vishalni2004) updating Admin's lead
    await testUserPatch("vishalni2004@gmail.com", leadAdmin.id, "NEW", "BLANK");
    // 3. Test Worker updating Admin's lead (Should be Forbidden)
    await testUserPatch("solobuildworker@gmail.com", leadAdmin.id, "CONTACTED", "CHATTING");
  }

  if (leadWorker) {
    // 4. Test Worker updating their own lead (Should succeed)
    await testUserPatch("solobuildworker@gmail.com", leadWorker.id, "CONTACTED", "CHATTING");
  }
}

main().catch(console.error);
