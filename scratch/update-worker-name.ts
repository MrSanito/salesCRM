import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const updated = await prisma.user.update({
    where: { email: 'solobuildworker@gmail.com' },
    data: { name: 'solobuildworker' }
  });
  console.log("Updated user:", updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
