/**
 * SSE hook for real-time exam events.
 *
 * SECURITY NOTE: This hook intentionally avoids token-in-query-string.
 * Backend auth should be resolved from Authorization header or access_token cookie.
 */

import { useEffect, useRef, useState } from 'react';

export interface ExamSseEvent {
 eventType: 'EXAM_SUBMITTED' | 'ATTEMPT_STARTED' | 'ATTEMPT_ENDED' | 'SNAPSHOT';
 activeAttemptCount: number;
 totalSubmissionsToday: number;
 examTitle?: string;
 userId?: number;
 timestamp: number;
}

export function useExamEventsSSE(accessToken: string | null) {
 const [activeAttempts, setActiveAttempts] = useState(0);
 const [submissionsToday, setSubmissionsToday] = useState(0);
 const [lastEvent, setLastEvent] = useState<ExamSseEvent | null>(null);
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

 // exam_service runs on port 8082 with context path /api/v1/exam
 const examServiceUrl = import.meta.env.VITE_EXAM_SERVICE_URL || 'http://localhost:8082';
 const url = `${examServiceUrl}/api/v1/exam/sse/events`;

 const es = new EventSource(url, { withCredentials: true });
 emitterRef.current = es;

 es.addEventListener('exam', (e: MessageEvent) => {
 try {
 const data: ExamSseEvent = JSON.parse(e.data);
 setActiveAttempts(data.activeAttemptCount);
 setSubmissionsToday(data.totalSubmissionsToday);
 setLastEvent(data);
 } catch {
 // ignore
 }
 });

 es.onopen = () => {
 reconnectDelay = 1000;
 console.log('[useExamEventsSSE] connected');
 };

 es.onerror = () => {
 if (stopped) {
 return;
 }
 console.warn(`[useExamEventsSSE] SSE error, reconnecting in ${reconnectDelay}ms...`);
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

 return () => {
 stopped = true;
 emitterRef.current?.close();
 if (reconnectTimeoutRef.current) {
 clearTimeout(reconnectTimeoutRef.current);
 }
 };
 }, [accessToken]);

 return { activeAttempts, submissionsToday, lastEvent };
}
