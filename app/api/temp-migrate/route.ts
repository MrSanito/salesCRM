import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await prisma.lead.updateMany({
      where: {
        stage: 'CUSTOMER' as any
      },
      data: {
        stage: 'CLIENT' as any
      }
    });
    return NextResponse.json({ message: `Updated ${result.count} leads from CUSTOMER to CLIENT` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
