const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const filters = await prisma.sidebarFilter.findMany();
  console.log(JSON.stringify(filters, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
