import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useExamEventsSSE, type ExamSseEvent } from "../hooks/useExamEventsSSE";

const isExtractionEvent = (event: ExamSseEvent): boolean =>
  event.eventType === "AI_EXTRACTION_SUCCESS" ||
  event.eventType === "AI_EXTRACTION_SUCCESS_MANUAL" ||
  event.eventType === "AI_EXTRACTION_FAILED";

const buildToastId = (event: ExamSseEvent): string =>
  `${event.eventType}:${event.uploadRequestId ?? "na"}:${event.extractedExamId ?? event.examId ?? "na"}:${event.timestamp}`;

const resolveMessage = (event: ExamSseEvent): string => {
  if (event.message && event.message.trim()) {
    return event.message.trim();
  }

  if (event.eventType === "AI_EXTRACTION_FAILED") {
    return "AI trích xuất đề thất bại.";
  }

  return "AI đã trích xuất đề thi xong.";
};

const ExamExtractionNotifier: React.FC = () => {
  const accessToken =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("access_token");
  const { subscribe } = useExamEventsSSE(accessToken);
  const seenToastIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return subscribe((event) => {
      if (!isExtractionEvent(event)) {
        return;
      }

      const toastId = buildToastId(event);
      if (seenToastIdsRef.current.has(toastId)) {
        return;
      }
      seenToastIdsRef.current.add(toastId);

      if (event.eventType === "AI_EXTRACTION_FAILED") {
        toast.error(resolveMessage(event), { id: toastId });
        return;
      }

      toast.success(resolveMessage(event), { id: toastId });
    });
  }, [subscribe]);

  return null;
};

export default ExamExtractionNotifier;
