import type { SubscriptionStatus } from "../api/axiosClient";
import type { AttemptResult, AttemptSummary, OnlineExamStatus } from "../api/examClient";

export const ONLINE_EXAM_STATUS_LABEL: Record<OnlineExamStatus, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Công khai",
  ARCHIVED: "Lưu trữ",
};

export const formatOnlineExamStatus = (status: OnlineExamStatus): string => {
  return ONLINE_EXAM_STATUS_LABEL[status] ?? status;
};

export type AttemptStatus = AttemptResult["status"] | AttemptSummary["status"];

export const ATTEMPT_STATUS_LABEL: Record<AttemptStatus, string> = {
  IN_PROGRESS: "Đang làm",
  SUBMITTED: "Đã nộp",
  AUTO_SUBMITTED: "Tự nộp",
  PARTIALLY_GRADED: "Chấm một phần",
  GRADED: "Đã chấm",
};

export const formatAttemptStatus = (status: AttemptStatus): string => {
  return ATTEMPT_STATUS_LABEL[status] ?? status;
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
};

export const formatSubscriptionStatus = (status: SubscriptionStatus): string => {
  return SUBSCRIPTION_STATUS_LABEL[status] ?? status;
};
