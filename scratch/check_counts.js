const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leadsCount = await prisma.lead.count();
  console.log('Leads count:', leadsCount);
  const filtersCount = await prisma.sidebarFilter.count();
  console.log('Filters count:', filtersCount);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
