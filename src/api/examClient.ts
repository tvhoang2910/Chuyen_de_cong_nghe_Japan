import axios from 'axios';

export type OnlineExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ExamOption = {
  id?: number;
  content: string;
  isCorrect: boolean;
};

export type ExamQuestion = {
  id?: number;
  content: string;
  explanation?: string;
  scoreWeight: number;
  options: ExamOption[];
};

export type ExamSummary = {
  id: number;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  tags: string[];
  totalQuestions: number;
  status: OnlineExamStatus;
  createdAt: string;
  modifiedAt: string;
};

export type ExamDetail = ExamSummary & {
  questions: ExamQuestion[];
};

export type CreateExamPayload = {
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  tags: string[];
  questions: ExamQuestion[];
};

const examApiBaseUrl = import.meta.env.VITE_EXAM_API_BASE_URL || 'http://localhost:8082/api/v1/exam';

const examClient = axios.create({
  baseURL: examApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

examClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchManagedExams = async (): Promise<ExamSummary[]> => {
  const response = await examClient.get<ExamSummary[]>('/exams/manage');
  return response.data;
};

export const fetchManagedExamDetail = async (examId: number): Promise<ExamDetail> => {
  const response = await examClient.get<ExamDetail>(`/exams/manage/${examId}`);
  return response.data;
};

export const createExam = async (payload: CreateExamPayload): Promise<ExamDetail> => {
  const response = await examClient.post<ExamDetail>('/exams', payload);
  return response.data;
};

export const updateExam = async (examId: number, payload: CreateExamPayload): Promise<ExamDetail> => {
  const response = await examClient.put<ExamDetail>(`/exams/${examId}`, payload);
  return response.data;
};

export const deleteExam = async (examId: number): Promise<void> => {
  await examClient.delete(`/exams/${examId}`);
};

export const updateExamStatus = async (examId: number, status: OnlineExamStatus): Promise<ExamSummary> => {
  const response = await examClient.patch<ExamSummary>(`/exams/${examId}/status?status=${status}`);
  return response.data;
};

export const fetchPublicExams = async (): Promise<ExamSummary[]> => {
  const response = await examClient.get<ExamSummary[]>('/exams/public');
  return response.data;
};

export const fetchPublicExamDetail = async (examId: number): Promise<ExamDetail> => {
  const response = await examClient.get<ExamDetail>(`/exams/public/${examId}`);
  return response.data;
};
