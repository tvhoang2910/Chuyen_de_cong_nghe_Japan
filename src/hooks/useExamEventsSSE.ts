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

    const connect = () => {
      if (stopped) {
        return;
      }

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
        if (stopped) {
          return;
        }
        console.warn('[useExamEventsSSE] SSE error, reconnecting in 5s...');
        es.close();
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
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
