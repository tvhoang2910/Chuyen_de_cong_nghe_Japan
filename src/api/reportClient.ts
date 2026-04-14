import axios from 'axios';
import { examApiBaseUrl } from '../config/env';
import type { QuestionReportResponse, ReportType } from './examClient';

const reportClient = axios.create({
  baseURL: examApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

reportClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ReportQueueItem = {
  questionId: number;
  questionPreview: string;
  examId: number;
  examTitle: string;
  topReportType: ReportType;
  topReportTypeLabel: string;
  totalReportCount: number;
  uniqueReportersCount: number;
  reportTypeCounts: Record<string, number>;
  latestReportedAt: string;
};

export type ReportQueuePage = {
  content: ReportQueueItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type ResolveReportPayload = {
  status: 'REVIEWING' | 'RESOLVED' | 'REJECTED';
  resolutionNote?: string;
  unhideQuestion: boolean;
};

export const fetchReportQueue = async (page = 0, size = 20): Promise<ReportQueuePage> => {
  const response = await reportClient.get<ReportQueuePage>('/admin/reports', {
    params: { page, size },
  });
  return response.data;
};

export const fetchProcessedReportQueue = async (page = 0, size = 20): Promise<ReportQueuePage> => {
  const response = await reportClient.get<ReportQueuePage>('/admin/reports/processed', {
    params: { page, size },
  });
  return response.data;
};

export const fetchReportsForQuestion = async (questionId: number): Promise<QuestionReportResponse[]> => {
  const response = await reportClient.get<QuestionReportResponse[]>(`/admin/reports/questions/${questionId}`);
  return response.data;
};

export const resolveQuestionReports = async (questionId: number, payload: ResolveReportPayload): Promise<void> => {
  await reportClient.put(`/admin/reports/questions/${questionId}/resolve`, payload);
};

export type QuestionReportHistoryResponse = {
  id: number;
  action: string;
  actionLabel: string;
  previousStatus: string | null;
  newStatus: string;
  note: string | null;
  processedBy: number;
  processedAt: string;
};

export const fetchReportHistory = async (questionId: number): Promise<QuestionReportHistoryResponse[]> => {
  const response = await reportClient.get<QuestionReportHistoryResponse[]>(`/admin/reports/questions/${questionId}/history`);
  return response.data;
};
