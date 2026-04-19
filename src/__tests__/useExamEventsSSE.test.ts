import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExamEventsSSE } from '../hooks/useExamEventsSSE';

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  public onopen: ((this: EventSource, ev: Event) => unknown) | null = null;
  public onerror: ((this: EventSource, ev: Event) => unknown) | null = null;

  private readonly listeners = new Map<string, Set<(event: MessageEvent) => void>>();

  constructor(_url: string, _init?: EventSourceInit) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {
    // no-op for tests
  }

  dispatchExamEvent(payload: unknown): void {
    const listeners = this.listeners.get('exam');
    if (!listeners) {
      return;
    }

    const event = {
      data: JSON.stringify(payload),
    } as MessageEvent;

    listeners.forEach((listener) => {
      listener(event);
    });
  }
}

describe('useExamEventsSSE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource as unknown as typeof EventSource);
  });

  it('subscribes and receives AI extraction success and failed events', () => {
    const listener = vi.fn();

    const { result } = renderHook(() => useExamEventsSSE('token'));

    const unsubscribe = result.current.subscribe(listener);
    const source = FakeEventSource.instances[0];

    act(() => {
      source.dispatchExamEvent({
        eventType: 'AI_EXTRACTION_SUCCESS',
        uploadRequestId: 7,
        extractedExamId: 55,
        message: 'ok',
        timestamp: Date.now(),
      });
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        eventType: 'AI_EXTRACTION_SUCCESS',
        uploadRequestId: 7,
      }),
    );

    act(() => {
      source.dispatchExamEvent({
        eventType: 'AI_EXTRACTION_FAILED',
        uploadRequestId: 7,
        message: 'failed',
        timestamp: Date.now(),
      });
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        eventType: 'AI_EXTRACTION_FAILED',
        uploadRequestId: 7,
      }),
    );

    unsubscribe();

    act(() => {
      source.dispatchExamEvent({
        eventType: 'AI_EXTRACTION_SUCCESS',
        uploadRequestId: 8,
        timestamp: Date.now(),
      });
    });

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
