import axios from "axios";
import { examApiBaseUrl } from "../config/env";

export type ExamUploadStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXTRACTING"
  | "EXTRACTED"
  | "EXTRACT_FAILED"
  | "SELF_UPLOADED";

export type UploaderRole = "USER" | "CONTRIBUTOR" | "ADMIN";

export interface PresignedPut {
  index: number;
  objectKey: string;
  url: string;
  expiresInSeconds: number;
}

export interface InitiateUploadResponse {
  uploadId: number;
  pages: PresignedPut[];
}

export interface InitiateUploadPayload {
  title: string;
  description?: string;
  pageCount: number;
  contentType: string;
}

export interface ExamUploadResponse {
  /** Đây cũng là uploadRequestId dùng cho correlation SSE. */
  id: number;
  uploaderId: number;
  uploaderRole: UploaderRole;
  title: string;
  description?: string;
  pageCount: number;
  status: ExamUploadStatus;
  rejectionReason?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  extractedExamId?: number;
  extractionError?: string;
  createdAt: string;
  modifiedAt: string;
  viewUrls?: string[];
}

export interface ExamUploadHistoryResponse {
  id: number;
  action: string;
  previousStatus?: ExamUploadStatus;
  newStatus: ExamUploadStatus;
  actorId?: number;
  actorRole?: string;
  note?: string;
  createdAt: string;
}

export interface ExamUploadPageResponse {
  content: ExamUploadResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedUploadContentType =
  (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number];

export const MAX_UPLOAD_PAGES = 20;

const examUploadClient = axios.create({
  baseURL: examApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

examUploadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const initiateUpload = async (
  payload: InitiateUploadPayload,
): Promise<InitiateUploadResponse> => {
  const response = await examUploadClient.post<InitiateUploadResponse>(
    "/uploads/initiate",
    payload,
  );
  return response.data;
};

export const uploadPageToStorage = async (
  presignedUrl: string,
  file: File,
): Promise<void> => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Upload failed (${response.status}): ${response.statusText}`,
    );
  }
};

export const completeUpload = async (
  uploadId: number,
  note?: string,
): Promise<ExamUploadResponse> => {
  const response = await examUploadClient.post<ExamUploadResponse>(
    `/uploads/${uploadId}/complete`,
    { note },
  );
  return response.data;
};

export const fetchMyUploads = async (
  page: number,
  size: number,
  status?: ExamUploadStatus,
): Promise<ExamUploadPageResponse> => {
  const response = await examUploadClient.get<ExamUploadPageResponse>(
    "/uploads/mine",
    {
      params: {
        page,
        size,
        ...(status ? { status } : {}),
      },
    },
  );
  return response.data;
};

export const fetchUploadDetail = async (
  uploadId: number,
): Promise<ExamUploadResponse> => {
  const response = await examUploadClient.get<ExamUploadResponse>(
    `/uploads/${uploadId}`,
  );
  return response.data;
};

export const fetchUploadHistory = async (
  uploadId: number,
): Promise<ExamUploadHistoryResponse[]> => {
  const response = await examUploadClient.get<ExamUploadHistoryResponse[]>(
    `/uploads/${uploadId}/history`,
  );
  return response.data;
};

export const fetchPendingQueue = async (
  page: number,
  size: number,
): Promise<ExamUploadPageResponse> => {
  const response = await examUploadClient.get<ExamUploadPageResponse>(
    "/admin/uploads/queue",
    {
      params: { page, size },
    },
  );
  return response.data;
};

export const approveUpload = async (
  uploadId: number,
): Promise<ExamUploadResponse> => {
  const response = await examUploadClient.post<ExamUploadResponse>(
    `/admin/uploads/${uploadId}/approve`,
  );
  return response.data;
};

export const rejectUpload = async (
  uploadId: number,
  reason: string,
): Promise<ExamUploadResponse> => {
  const response = await examUploadClient.post<ExamUploadResponse>(
    `/admin/uploads/${uploadId}/reject`,
    { reason },
  );
  return response.data;
};

export const fetchAdminUploadHistory = async (
  uploadId: number,
): Promise<ExamUploadHistoryResponse[]> => {
  const response = await examUploadClient.get<ExamUploadHistoryResponse[]>(
    `/admin/uploads/${uploadId}/history`,
  );
  return response.data;
};
