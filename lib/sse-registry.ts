const globalForSSE = global as unknown as { sseClients: Map<string, Set<ReadableStreamDefaultController>> };

export const sseClients = globalForSSE.sseClients || new Map<string, Set<ReadableStreamDefaultController>>();

if (process.env.NODE_ENV !== 'production') globalForSSE.sseClients = sseClients;

export function addClient(userId: string, controller: ReadableStreamDefaultController) {
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId)!.add(controller);
  console.log(`[SSE] Client added for user: ${userId}. Total clients for this user: ${sseClients.get(userId)!.size}`);
}

export function removeClient(userId: string, controller: ReadableStreamDefaultController) {
  const userClients = sseClients.get(userId);
  if (userClients) {
    userClients.delete(controller);
    if (userClients.size === 0) {
      sseClients.delete(userId);
    }
  }
  console.log(`[SSE] Client removed for user: ${userId}`);
}

export function pushToUser(userId: string, alerts: any[]) {
  const clients = sseClients.get(userId);
  console.log(`[SSE] Pushing ${alerts.length} alerts to user: ${userId}. Active connections: ${clients?.size || 0}`);
  
  if (clients) {
    const data = `data: ${JSON.stringify(alerts)}\n\n`;
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    clients.forEach((client) => {
      try {
        client.enqueue(encodedData);
      } catch (err) {
        console.error(`[SSE] Error pushing to client for user ${userId}:`, err);
      }
    });
  }
}
