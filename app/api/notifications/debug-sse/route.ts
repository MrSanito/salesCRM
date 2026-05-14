import { NextResponse } from 'next/server';
import { sseClients } from '@/lib/sse-registry';

export async function GET() {
  const users = Array.from(sseClients.keys());
  const clientsCount = users.map(u => ({ userId: u, connections: sseClients.get(u)?.size }));
  
  return NextResponse.json({
    totalUsersConnected: users.length,
    clients: clientsCount
  });
}
