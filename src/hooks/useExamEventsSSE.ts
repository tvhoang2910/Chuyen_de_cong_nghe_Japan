import { useEffect, useRef, useCallback, useState } from 'react';

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

  const connect = useCallback(() => {
    if (!accessToken) return;

    // exam_service runs on port 8082 with context path /api/v1/exam
    const examServiceUrl = import.meta.env.VITE_EXAM_SERVICE_URL || 'http://localhost:8082';
    const url = `${examServiceUrl}/api/v1/exam/sse/events?token=${encodeURIComponent(accessToken)}`;

    const es = new EventSource(url, { withCredentials: false });
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

    es.onerror = () => {
      console.warn('[useExamEventsSSE] SSE error, reconnecting in 5s...');
      es.close();
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };
  }, [accessToken]);

  useEffect(() => {
    connect();
    return () => {
      emitterRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { activeAttempts, submissionsToday, lastEvent };
}
