import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await prisma.user.findUnique({
    where: { email: 'solobuildceo@gmail.com' },
    select: { id: true, name: true }
  });
  return NextResponse.json(user);
}
