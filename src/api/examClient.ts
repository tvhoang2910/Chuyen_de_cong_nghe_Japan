import axios from "axios";

export type OnlineExamStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

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
  scoreWeight: number;
  options: ExamOption[];
};

export type ExamSummary = {
  id: number;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
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
  tagIds: number[];
  newTags?: string[];
  questions: ExamQuestion[];
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
  selectedOptionIds: number[];
  responseTimeMs?: number;
  answerChangeCount?: number;
};

export type SaveAttemptAnswersBatchPayload = {
  answers: SaveAttemptAnswerPayload[];
};

export type AttemptQuestionResult = {
  questionId: number;
  content: string;
  maxScore: number;
  earnedScore: number;
  correct: boolean;
  options: { id: number; content: string }[];
  selectedOptionIds: number[];
  correctOptionIds: number[];
  responseTimeMs?: number;
  answerChangeCount?: number;
};

export type AttemptResult = {
  attemptId: number;
  examId: number;
  examTitle: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
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
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
  startedAt: string;
  submittedAt?: string;
  scoreRaw?: number;
  scoreMax?: number;
  scorePercent?: number;
  passed?: boolean;
};

const examApiBaseUrl =
  import.meta.env.VITE_EXAM_API_BASE_URL || "http://localhost:8082/api/v1/exam";

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
