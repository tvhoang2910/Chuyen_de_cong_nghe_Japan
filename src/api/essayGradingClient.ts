import axios from "axios";
import { examApiBaseUrl } from "../config/env";

export type EssaySubmissionSummary = {
  id: number;
  answerId?: number;
  studentName: string;
  examTitle: string;
  submittedAt: string;
  questionPreview?: string | null;
};

export type EssaySubmissionDetail = EssaySubmissionSummary & {
  questionId?: number;
  question?: string | null;
  questionContent?: string | null;
  essayAnswer?: string | null;
  sampleAnswer?: string | null;
  gradingGuide?: string | null;
  score?: number | null;
  maxScore?: number | null;
  scoreWeight?: number | null;
  feedback?: string | null;
};

export type GradeEssaySubmissionPayload = {
  score: number;
  feedback: string;
};

type PendingEssaySubmissionsResponse =
  | EssaySubmissionSummary[]
  | {
      content?: EssaySubmissionSummary[];
    };

const essayGradingClient = axios.create({
  baseURL: examApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

essayGradingClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchPendingEssaySubmissions = async (): Promise<
  EssaySubmissionSummary[]
> => {
  const response =
    await essayGradingClient.get<PendingEssaySubmissionsResponse>(
      "/essay-submissions/pending",
    );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.content ?? [];
};

export const fetchEssaySubmissionDetail = async (
  submissionId: number,
): Promise<EssaySubmissionDetail> => {
  const response = await essayGradingClient.get<EssaySubmissionDetail>(
    `/essay-submissions/${submissionId}`,
  );
  return response.data;
};

export const gradeEssaySubmission = async (
  submissionId: number,
  payload: GradeEssaySubmissionPayload,
): Promise<EssaySubmissionDetail> => {
  const response = await essayGradingClient.put<EssaySubmissionDetail>(
    `/essay-submissions/${submissionId}/grade`,
    payload,
  );
  return response.data;
};
