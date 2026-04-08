import axios, { type InternalAxiosRequestConfig } from "axios";

const apiBaseUrl =
  import.meta.env.VITE_COMMUNITY_API_BASE_URL ||
  "http://localhost:8084/api/v1/community";

export type CommentNode = {
  id: number;
  content: string;
  replies: CommentNode[];
  upvotes: number;
  downvotes: number;
  pinned: boolean;
  replyCount: number;
  userVote: "UP" | "DOWN" | "NONE";
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
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

export const createComment = async (payload: CreateCommentPayload) => {
  const response = await client.post("/comments", payload);
  return response.data;
};

export const voteComment = async (
  commentId: number,
  voteType: "UP" | "DOWN",
) => {
  const response = await client.post(`/comments/${commentId}/vote`, {
    voteType,
  });
  return response.data;
};

export const pinComment = async (commentId: number, pinned: boolean) => {
  const response = await client.post(`/comments/${commentId}/pin`, {
    pinned,
  });
  return response.data;
};

export default client;
