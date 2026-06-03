/**
 * SSE hook for real-time exam events.
 *
 * SECURITY NOTE: This hook intentionally avoids token-in-query-string.
 * Backend auth should be resolved from Authorization header or access_token cookie.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { examApiBaseUrl } from '../config/env';

export type ExamSseEventType =
  | 'EXAM_SUBMITTED'
  | 'ATTEMPT_STARTED'
  | 'ATTEMPT_ENDED'
  | 'SNAPSHOT'
  | 'AI_EXTRACTION_SUCCESS'
  | 'AI_EXTRACTION_SUCCESS_MANUAL'
  | 'AI_EXTRACTION_FAILED';

export interface ExamSseEvent {
  eventType: ExamSseEventType;
  activeAttemptCount?: number;
  totalSubmissionsToday?: number;
  examId?: number;
  examTitle?: string;
  userId?: number;
  uploadRequestId?: number;
  extractedExamId?: number;
  message?: string;
  timestamp: number;
}

export type ExamSseListener = (event: ExamSseEvent) => void;

export interface UseExamEventsSSEResult {
  activeAttempts: number;
  submissionsToday: number;
  lastEvent: ExamSseEvent | null;
  subscribe: (listener: ExamSseListener) => () => void;
}

export function useExamEventsSSE(
  accessToken: string | null,
): UseExamEventsSSEResult {
  const [activeAttempts, setActiveAttempts] = useState(0);
  const [submissionsToday, setSubmissionsToday] = useState(0);
  const [lastEvent, setLastEvent] = useState<ExamSseEvent | null>(null);
  const emitterRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<Set<ExamSseListener>>(new Set());

  const subscribe = useCallback((listener: ExamSseListener): (() => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

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

      const url = `${examApiBaseUrl}/sse/events`;

      const es = new EventSource(url, { withCredentials: true });
      emitterRef.current = es;

      es.addEventListener('exam', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as ExamSseEvent;
          if (typeof data.activeAttemptCount === 'number') {
            setActiveAttempts(data.activeAttemptCount);
          }
          if (typeof data.totalSubmissionsToday === 'number') {
            setSubmissionsToday(data.totalSubmissionsToday);
          }
          setLastEvent(data);
          listenersRef.current.forEach((listener) => {
            try {
              listener(data);
            } catch {
              // ignore listener errors
            }
          });
        } catch {
          // ignore parse errors
        }
      });

      es.onopen = () => {
        reconnectDelay = 1000;
      };

      es.onerror = () => {
        if (stopped) {
          return;
        }
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

  return { activeAttempts, submissionsToday, lastEvent, subscribe };
}
