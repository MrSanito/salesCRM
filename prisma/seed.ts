import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting migration: CUSTOMER -> CLIENT");
  const result = await prisma.lead.updateMany({
    where: {
      stage: 'CUSTOMER' as any
    },
    data: {
      stage: 'CLIENT' as any
    }
  });
  console.log(`Updated ${result.count} leads from CUSTOMER to CLIENT`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });