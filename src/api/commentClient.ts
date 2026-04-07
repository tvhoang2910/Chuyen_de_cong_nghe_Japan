import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const apiBaseUrl =
  import.meta.env.VITE_COMMUNITY_API_BASE_URL ||
  "http://localhost:8080/api/v1/community";

export type CommentNode = {
  id: number;
  content: string;
  replies: CommentNode[];
};

export type CreateCommentPayload = {
  userId: number;
  targetId: number;
  parentId: number | null;
  content: string;
};

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchCommentsByExam = async (
  examId: number,
): Promise<CommentNode[]> => {
  const response = await client.get<CommentNode[]>(`/comments/exam/${examId}`);
  return response.data;
};

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const createComment = async (payload: CreateCommentPayload) => {
  const response = await client.post("/comments", payload);
  return response.data;
};

export default client;
