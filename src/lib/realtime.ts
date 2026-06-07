import { Message } from '@/types';
import { useAppStore } from '@/store/useStore';

const WS_BASE = 'ws://localhost:8000/ws/app/';

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleDataSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    useAppStore.getState().fetchData();
  }, 200);
}

export function handleRealtimeEvent(data: {
  type: string;
  payload?: unknown;
  resource?: string;
}) {
  switch (data.type) {
    case 'connected':
      return;
    case 'chat_message':
      if (data.payload) {
        useAppStore.getState().appendMessage(data.payload as Message);
      }
      return;
    case 'messages_read':
      if (data.payload) {
        useAppStore.getState().applyMessagesRead(
          data.payload as { collectorId: string; role: 'admin' | 'collector' }
        );
      }
      return;
    case 'data_change':
      scheduleDataSync();
      return;
    default:
      return;
  }
}

export function createAppWebSocket(accessToken: string): WebSocket {
  return new WebSocket(`${WS_BASE}?token=${encodeURIComponent(accessToken)}`);
}
