import { useEffect, useRef, useCallback, useState } from 'react';

export interface PresenceEvent {
  eventType: 'JOIN' | 'LEAVE' | 'SNAPSHOT';
  role: string;
  onlineCount: number;
  timestamp: number;
}

export function usePresenceSSE(accessToken: string | null) {
  const [onlineCount, setOnlineCount] = useState(0);
  const emitterRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!accessToken) return;

    const authBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1/auth';
    const url = `${authBaseUrl}/sse/presence?token=${encodeURIComponent(accessToken)}`;

    const es = new EventSource(url, { withCredentials: false });
    emitterRef.current = es;

    es.onopen = () => {
      console.log('[usePresenceSSE] connected');
    };

    es.addEventListener('presence', (e: MessageEvent) => {
      try {
        const data: PresenceEvent = JSON.parse(e.data);
        if (data.eventType === 'SNAPSHOT' || data.eventType === 'JOIN' || data.eventType === 'LEAVE') {
          setOnlineCount(data.onlineCount);
        }
      } catch {
        // ignore parse errors
      }
    });

    es.onerror = () => {
      console.warn('[usePresenceSSE] SSE error, reconnecting in 5s...');
      es.close();
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };
  }, [accessToken]);

  useEffect(() => {
    connect();

    // Heartbeat every 30s
    const heartbeatInterval = setInterval(() => {
      if (accessToken) {
        const authBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1/auth';
        void fetch(`${authBaseUrl}/sse/presence/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    }, 30_000);

    return () => {
      emitterRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(heartbeatInterval);
    };
  }, [connect, accessToken]);

  return { onlineCount };
}
