import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_COMMUNITY_API_BASE_URL ||
  "http://localhost:8084/api/v1/community";

export type ExamRatingSummary = {
  examId: number;
  averageRating: number;
  ratingCount: number;
  userRating: number | null;
};

export type SubmitExamRatingPayload = {
  examId: number;
  rating: number;
};

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchExamRatingSummary = async (
  examId: number,
): Promise<ExamRatingSummary> => {
  const response = await client.get<ExamRatingSummary>(
    `/ratings/exams/${examId}`,
  );
  return response.data;
};

export const fetchExamRatingSummaries = async (
  examIds: number[],
): Promise<ExamRatingSummary[]> => {
  if (examIds.length === 0) {
    return [];
  }

  const query = new URLSearchParams();
  examIds.forEach((examId) => query.append("examIds", String(examId)));

  const response = await client.get<ExamRatingSummary[]>(
    `/ratings/exams?${query.toString()}`,
  );
  return response.data;
};

export const submitExamRating = async (
  payload: SubmitExamRatingPayload,
): Promise<ExamRatingSummary> => {
  const response = await client.post<ExamRatingSummary>("/ratings", payload);
  return response.data;
};

export default client;
