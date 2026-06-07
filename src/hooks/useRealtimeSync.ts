'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useStore';
import { createAppWebSocket, handleRealtimeEvent } from '@/lib/realtime';

export function useRealtimeSync(enabled = true) {
  const { isLoggedIn, accessToken } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !isLoggedIn || !accessToken) return;

    let closed = false;

    const connect = () => {
      if (closed) return;

      const ws = createAppWebSocket(accessToken);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!closed) {
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, isLoggedIn, accessToken]);
}
