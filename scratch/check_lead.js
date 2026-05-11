import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const leadId = process.argv[2];
  if (!leadId) {
    console.log("Usage: node check_lead.js <leadId>");
    process.exit(1);
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, lastCommunicatedAt: true }
  });

  const interactions = await prisma.interaction.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log("Lead Status:", JSON.stringify(lead, null, 2));
  console.log("Interactions Count:", interactions.length);
  console.log("Recent Interactions:", JSON.stringify(interactions, null, 2));
}

main().finally(() => prisma.$disconnect());
