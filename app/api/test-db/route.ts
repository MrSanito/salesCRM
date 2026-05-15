import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 

export async function GET() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
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
        where: { type: 'FOLLOW_UP_DUE' },
        select: { id: true, createdAt: true }
      }
    },
    orderBy: { followUpAt: 'desc' },
    take: 5
  });

  return NextResponse.json({
    now: now.toISOString(),
    oneHourFromNow: oneHourFromNow.toISOString(),
    leads
  });
}
