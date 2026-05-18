import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });

  console.log("Users in DB:");
  console.log(JSON.stringify(users, null, 2));

  const leadCounts = await prisma.lead.groupBy({
    by: ['ownerId'],
    _count: {
      id: true
    }
  });

  console.log("\nLead counts per owner ID:");
  console.log(JSON.stringify(leadCounts, null, 2));

  // Get details for all leads
  const firstFewLeads = await prisma.lead.findMany({
    take: 5,
    select: {
      id: true,
      contactName: true,
      ownerId: true,
      owner: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });
  console.log("\nFirst 5 leads sample:");
  console.log(JSON.stringify(firstFewLeads, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
