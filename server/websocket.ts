import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Event types for real-time updates
export type WebSocketEvent = 
  | { type: 'competition_updated'; competitionId: string }
  | { type: 'competition_created' }
  | { type: 'competition_deleted'; competitionId: string }
  | { type: 'user_updated'; userId: string }
  | { type: 'order_created'; userId: string }
  | { type: 'order_updated'; orderId: string }
  | { type: 'ticket_created'; userId: string }
  | { type: 'winner_drawn'; competitionId: string }
  | { type: 'spin_updated'; spinId: string }
  | { type: 'spin_created' }
  | { type: 'scratch_updated'; scratchId: string }
  | { type: 'scratch_created' }
  | { type: 'transaction_created'; userId: string }
  | { type: 'wallet_updated'; userId: string };

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection success
      ws.send(JSON.stringify({ type: 'connected' }));
    });

    console.log('WebSocket server initialized at /ws');
  }

  // Broadcast event to all connected clients
  broadcast(event: WebSocketEvent) {
    const message = JSON.stringify(event);
    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          successCount++;
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          failCount++;
        }
      }
    });

    if (successCount > 0) {
      console.log(`📡 Broadcast: ${event.type} to ${successCount} clients`);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();
