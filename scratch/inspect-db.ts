import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const filters = await prisma.sidebarFilter.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
          role: true,
        }
      }
    }
  });
  console.log("=== SIDEBAR FILTERS ===");
  console.log(JSON.stringify(filters, null, 2));

  const totalLeads = await prisma.lead.count();
  console.log("\nTotal leads count:", totalLeads);

  const leadsSample = await prisma.lead.findMany({
    take: 5,
    include: {
      source: true,
    }
  });
  console.log("\n=== LEADS SAMPLE ===");
  console.log(JSON.stringify(leadsSample, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
