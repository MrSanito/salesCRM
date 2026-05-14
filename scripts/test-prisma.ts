import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  console.log("Time window:");
  console.log("Now: ", now.toISOString());
  console.log("1 Hour from now:", oneHourFromNow.toISOString());

  const leads = await prisma.lead.findMany({
    where: {
      followUpAt: { not: null }
    },
    select: {
      id: true,
      contactName: true,
      followUpAt: true,
      ownerId: true,
      alerts: {
        where: {
          type: 'FOLLOW_UP_DUE'
        },
        select: {
          id: true,
          createdAt: true
        }
      }
    },
    orderBy: { followUpAt: 'desc' },
    take: 5
  });

  console.log("Recent follow-ups in DB:", JSON.stringify(leads, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
