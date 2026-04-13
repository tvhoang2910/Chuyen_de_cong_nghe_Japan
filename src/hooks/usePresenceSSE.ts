/**
 * SSE hook for real-time presence (online user count).
 *
 * SECURITY NOTE: This hook intentionally avoids token-in-query-string.
 * Backend auth should be resolved from Authorization header or access_token cookie.
 */

import { useEffect, useRef, useState } from 'react';
import { authApiBaseUrl } from '../config/env';

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

 useEffect(() => {
 if (!accessToken) {
 return undefined;
 }

 let stopped = false;
 // Exponential backoff state: starts at 1s, caps at 30s
 let reconnectDelay = 1000;
 const MAX_RECONNECT_DELAY = 30_000;

 const connect = () => {
 if (stopped) {
 return;
 }

 const url = `${authApiBaseUrl}/sse/presence`;

 const es = new EventSource(url, { withCredentials: true });
 emitterRef.current = es;

 es.onopen = () => {
 reconnectDelay = 1000;
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
 if (stopped) {
 return;
 }
 console.warn(`[usePresenceSSE] SSE error, reconnecting in ${reconnectDelay}ms...`);
 es.close();
 if (reconnectTimeoutRef.current) {
 clearTimeout(reconnectTimeoutRef.current);
 }
 reconnectTimeoutRef.current = setTimeout(() => {
 connect();
 // Exponential backoff with jitter
 reconnectDelay = Math.min(
 reconnectDelay * 2 + Math.random() * 1000,
 MAX_RECONNECT_DELAY,
 );
 }, reconnectDelay);
 };
 };

 connect();

 // Heartbeat every 30s
 const heartbeatInterval = setInterval(() => {
 if (accessToken) {
 void fetch(`${authApiBaseUrl}/sse/presence/heartbeat`, {
 method: 'POST',
 headers: { Authorization: `Bearer ${accessToken}` },
 });
 }
 }, 30_000);

 return () => {
 stopped = true;
 emitterRef.current?.close();
 if (reconnectTimeoutRef.current) {
 clearTimeout(reconnectTimeoutRef.current);
 }
 clearInterval(heartbeatInterval);
 };
 }, [accessToken]);

 return { onlineCount };
}
