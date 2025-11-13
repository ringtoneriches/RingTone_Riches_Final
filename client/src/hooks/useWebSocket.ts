import { useEffect, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';

type WebSocketEvent = 
  | { type: 'connected' }
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

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function connect() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket connected - real-time updates enabled');
        };

        ws.onmessage = (event) => {
          try {
            const data: WebSocketEvent = JSON.parse(event.data);
            
            switch (data.type) {
              case 'connected':
                console.log('📡 WebSocket connected successfully');
                break;

              // Competition updates
              case 'competition_created':
              case 'competition_updated':
              case 'competition_deleted':
                queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/competitions'] });
                break;

              // Spin wheel updates
              case 'spin_created':
              case 'spin_updated':
                queryClient.invalidateQueries({ queryKey: ['/api/spin-wheels'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/spin-wheels'] });
                break;

              // Scratch card updates
              case 'scratch_created':
              case 'scratch_updated':
                queryClient.invalidateQueries({ queryKey: ['/api/scratch-cards'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/scratch-cards'] });
                break;

              // User-specific updates
              case 'order_created':
              case 'order_updated':
                queryClient.invalidateQueries({ queryKey: ['/api/user/orders'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
                break;

              case 'ticket_created':
                queryClient.invalidateQueries({ queryKey: ['/api/user/tickets'] });
                queryClient.invalidateQueries({ queryKey: ['/api/user/entries'] });
                break;

              case 'transaction_created':
                queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
                break;

              case 'wallet_updated':
              case 'user_updated':
                queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
                break;

              case 'winner_drawn':
                queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/competitions'] });
                queryClient.invalidateQueries({ queryKey: ['/api/winners'] });
                break;
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected - attempting to reconnect...');
          wsRef.current = null;
          
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
}
