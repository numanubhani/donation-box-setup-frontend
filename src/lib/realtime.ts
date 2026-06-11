import { Message } from '@/types';
import { useAppStore } from '@/store/useStore';

function getWsBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
  const url = new URL(apiUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/app/';
  url.search = '';
  return url.toString();
}

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
  return new WebSocket(`${getWsBase()}?token=${encodeURIComponent(accessToken)}`);
}
