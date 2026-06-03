import axios from "axios";
import { examApiBaseUrl } from "../config/env";

export type OnlineExamStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuestionType = "MULTIPLE_CHOICE" | "ESSAY";
export type AnswerStatus =
  | "AUTO_GRADED"
  | "PENDING_REVIEW"
  | "MANUALLY_GRADED";
export type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "AUTO_SUBMITTED"
  | "PARTIALLY_GRADED"
  | "GRADED";

export type TagOption = {
  id: number;
  name: string;
};

export type ExamOption = {
  id?: number;
  content: string;
  isCorrect?: boolean | null;
};

export type ExamQuestion = {
  id?: number;
  content: string;
  explanation?: string;
  questionType?: QuestionType;
  score?: number;
  scoreWeight: number;
  sampleAnswer?: string | null;
  gradingGuide?: string | null;
  options: ExamOption[];
};

export type ExamSummary = {
  id: number;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  premium: boolean;
  teaserQuestionCount: number;
  premiumLocked?: boolean;
  tags: TagOption[];
  totalQuestions: number;
  status: OnlineExamStatus;
  createdAt: string;
  modifiedAt: string;
};

export type ExamDetail = ExamSummary & {
  questions: ExamQuestion[];
};

export type PublicExamDetail = ExamSummary;

export type CreateExamPayload = {
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  premium: boolean;
  teaserQuestionCount: number;
  tagIds: number[];
  newTags?: string[];
  questions: ExamQuestion[];
};

export type ApiErrorResponse = {
  message?: string;
  error?: string;
};

export type CreateTagPayload = {
  name: string;
};

export type StartAttemptPayload = {
  examId: number;
  clientVersion?: string;
};

export type StartAttemptResponse = {
  attemptId: number;
  examId: number;
  startedAt: string;
  expiresAt: string;
  durationMinutes: number;
  maxAttempts: number;
};

export type SaveAttemptAnswerPayload = {
  questionId: number;
  selectedOptionId?: number;
  selectedOptionIds: number[];
  essayAnswer?: string;
  textAnswer?: string;
  responseTimeMs?: number;
  answerChangeCount?: number;
};

export type SaveAttemptAnswersBatchPayload = {
  answers: SaveAttemptAnswerPayload[];
};

export type AttemptQuestionResult = {
  answerId?: number;
  questionId: number;
  content: string;
  questionType?: QuestionType;
  maxScore: number;
  score?: number;
  scoreWeight?: number;
  earnedScore: number;
  correct: boolean;
  answerStatus?: AnswerStatus;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  essayAnswer?: string | null;
  textAnswer?: string | null;
  sampleAnswer?: string | null;
  gradingGuide?: string | null;
  teacherFeedback?: string | null;
  feedback?: string | null;
  options?: { id: number; content: string }[];
  selectedOptionIds?: number[];
  correctOptionIds?: number[];
  responseTimeMs?: number;
  answerChangeCount?: number;
};

export type AttemptResult = {
  attemptId: number;
  examId: number;
  examTitle: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  scoreRaw: number;
  scoreMax: number;
  scorePercent: number;
  passingScore: number;
  passed: boolean;
  questionResults: AttemptQuestionResult[];
};

export type AttemptSummary = {
  attemptId: number;
  examId: number;
  examTitle: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  scoreRaw?: number;
  scoreMax?: number;
  scorePercent?: number;
  passed?: boolean;
};

export const isAttemptResultAccessibleStatus = (
  status?: AttemptStatus,
): boolean => {
  return (
    status === "SUBMITTED" ||
    status === "AUTO_SUBMITTED" ||
    status === "PARTIALLY_GRADED" ||
    status === "GRADED"
  );
};

const examClient = axios.create({
  baseURL: examApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

examClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchManagedExams = async (): Promise<ExamSummary[]> => {
  const response = await examClient.get<ExamSummary[]>("/exams/manage");
  return response.data;
};

export const fetchManagedExamDetail = async (
  examId: number,
): Promise<ExamDetail> => {
  const response = await examClient.get<ExamDetail>(`/exams/manage/${examId}`);
  return response.data;
};

export const createExam = async (
  payload: CreateExamPayload,
): Promise<ExamDetail> => {
  const response = await examClient.post<ExamDetail>("/exams", payload);
  return response.data;
};

export const updateExam = async (
  examId: number,
  payload: CreateExamPayload,
): Promise<ExamDetail> => {
  const response = await examClient.put<ExamDetail>(
    `/exams/${examId}`,
    payload,
  );
  return response.data;
};

export const deleteExam = async (examId: number): Promise<void> => {
  await examClient.delete(`/exams/${examId}`);
};

export const updateExamStatus = async (
  examId: number,
  status: OnlineExamStatus,
): Promise<ExamSummary> => {
  const response = await examClient.patch<ExamSummary>(
    `/exams/${examId}/status?status=${status}`,
  );
  return response.data;
};

export const fetchPublicExams = async (): Promise<ExamSummary[]> => {
  const response = await examClient.get<ExamSummary[]>("/exams/public");
  return response.data;
};

export const fetchPublicExamDetail = async (
  examId: number,
): Promise<PublicExamDetail> => {
  const response = await examClient.get<PublicExamDetail>(
    `/exams/public/${examId}`,
  );
  return response.data;
};

export const fetchGlobalTags = async (query?: string): Promise<TagOption[]> => {
  const response = await examClient.get<TagOption[]>("/tags", {
    params: query ? { query } : {},
  });
  return response.data;
};

export const createGlobalTag = async (
  payload: CreateTagPayload,
): Promise<TagOption> => {
  const response = await examClient.post<TagOption>("/tags", payload);
  return response.data;
};

export const fetchAttemptView = async (examId: number): Promise<ExamDetail> => {
  const response = await examClient.get<ExamDetail>(
    `/exams/public/${examId}/attempt-view`,
  );
  return response.data;
};

export const startAttempt = async (
  payload: StartAttemptPayload,
): Promise<StartAttemptResponse> => {
  const response = await examClient.post<StartAttemptResponse>(
    "/attempts",
    payload,
  );
  return response.data;
};

export const saveAttemptAnswer = async (
  attemptId: number,
  payload: SaveAttemptAnswerPayload,
): Promise<void> => {
  await examClient.put(`/attempts/${attemptId}/answers`, payload);
};

export const saveAttemptAnswersBatch = async (
  attemptId: number,
  payload: SaveAttemptAnswersBatchPayload,
): Promise<void> => {
  await examClient.put(`/attempts/${attemptId}/answers/batch`, payload);
};

export const submitAttempt = async (
  attemptId: number,
): Promise<AttemptResult> => {
  const response = await examClient.post<AttemptResult>(
    `/attempts/${attemptId}/submit`,
  );
  return response.data;
};

export const fetchAttemptResult = async (
  attemptId: number,
): Promise<AttemptResult> => {
  const response = await examClient.get<AttemptResult>(
    `/attempts/${attemptId}/result`,
  );
  return response.data;
};

export const fetchMyAttemptHistory = async (): Promise<AttemptSummary[]> => {
  const response = await examClient.get<AttemptSummary[]>("/users/me/attempts");
  return response.data;
};

export const isPremiumUpgradeRequiredError = (status?: number, message?: string): boolean => {
  if (status !== 403 || !message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return normalized.includes('premium') && normalized.includes('upgrade');
};

export type ReportType =
  | 'WRONG_ANSWER'
  | 'TYPO'
  | 'MISSING_INFORMATION'
  | 'INVALID_QUESTION'
  | 'OTHER';

export type QuestionReportResponse = {
  id: number;
  questionId: number;
  questionPreview: string;
  attemptId: number;
  examId: number;
  examTitle: string;
  reporterId: number;
  reporterUsername: string;
  reportType: ReportType;
  reportTypeLabel: string;
  description: string | null;
  status: 'REPORTED' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
  statusLabel: string;
  resolutionNote: string | null;
  resolvedBy: number | null;
  resolvedByUsername: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export const submitQuestionReport = async (
  questionId: number,
  attemptId: number,
  payload: { reportType: ReportType; description?: string }
): Promise<QuestionReportResponse> => {
  const response = await examClient.post<QuestionReportResponse>(
    `/attempts/${attemptId}/questions/${questionId}/reports`,
    payload
  );
  return response.data;
};

export const uploadExamSource = async (
  title: string,
  file: File,
): Promise<ExamSummary> => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  const response = await examClient.post<ExamSummary>(
    "/exams/upload-source",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};
