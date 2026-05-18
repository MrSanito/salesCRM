import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const updated = await prisma.user.update({
    where: { email: 'sb.solobuild@gmail.com' },
    data: { name: 'sb.solobuild' }
  });
  console.log("Updated user:", updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
