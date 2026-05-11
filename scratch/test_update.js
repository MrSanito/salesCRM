const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lead = await prisma.lead.findFirst();
  if (!lead) {
    console.log("No lead found");
    return;
  }
  console.log("Found lead:", lead.id, lead.contactName);
  console.log("Current lastCommunicatedAt:", lead.lastCommunicatedAt);
  
  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: { lastCommunicatedAt: new Date() }
  });
  
  console.log("Updated lastCommunicatedAt:", updated.lastCommunicatedAt);
}

main().catch(console.error).finally(() => prisma.$disconnect());
