import React from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { subscribe, toastSuccess, toastError } = vi.hoisted(() => ({
  subscribe: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../hooks/useExamEventsSSE", () => ({
  useExamEventsSSE: () => ({
    activeAttempts: 0,
    submissionsToday: 0,
    lastEvent: null,
    subscribe,
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: toastSuccess,
    error: toastError,
  },
}));

import ExamExtractionNotifier from "../components/ExamExtractionNotifier";

describe("ExamExtractionNotifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("access_token", "token");
  });

  it("shows success toast for extraction success", () => {
    let listener: ((event: any) => void) | undefined;
    subscribe.mockImplementation((nextListener) => {
      listener = nextListener;
      return vi.fn();
    });

    render(<ExamExtractionNotifier />);

    listener?.({
      eventType: "AI_EXTRACTION_SUCCESS",
      uploadRequestId: 42,
      extractedExamId: 100,
      message: "AI xong rồi",
      timestamp: 1,
    });

    expect(toastSuccess).toHaveBeenCalledWith("AI xong rồi", {
      id: "AI_EXTRACTION_SUCCESS:42:100:1",
    });
  });

  it("deduplicates repeated extraction events", () => {
    let listener: ((event: any) => void) | undefined;
    subscribe.mockImplementation((nextListener) => {
      listener = nextListener;
      return vi.fn();
    });

    render(<ExamExtractionNotifier />);

    const event = {
      eventType: "AI_EXTRACTION_FAILED",
      uploadRequestId: 42,
      examId: 100,
      message: "Loi OCR",
      timestamp: 2,
    };

    listener?.(event);
    listener?.(event);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith("Loi OCR", {
      id: "AI_EXTRACTION_FAILED:42:100:2",
    });
  });
});
