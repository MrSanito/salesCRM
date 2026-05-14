const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.lead.findMany({
    where: {
      followUpAt: { not: null }
    },
    select: {
      id: true,
      contactName: true,
      followUpAt: true
    },
    orderBy: {
      followUpAt: 'desc'
    },
    take: 5
  });
  console.log("Recent Follow-up Leads:", leads);
  
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  console.log("Checking between:", now, "and", oneHourFromNow);
}
main().finally(() => prisma.$disconnect());
