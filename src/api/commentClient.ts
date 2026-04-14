import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

import { communityApiBaseUrl } from "../config/env";

export type VoteType = "UP" | "DOWN" | "NONE";

export type CommentNode = {
 id: number;
 userId?: number;
 authorName?: string | null;
 userFullName?: string | null;
 parentId?: number | null;
 replyToUserId?: number | null;
 replyToAuthorName?: string | null;
 replyToUserFullName?: string | null;
 content: string;
 createdAt?: string;
 replies: CommentNode[];
 upvotes: number;
 downvotes: number;
 pinned: boolean;
 replyCount: number;
 userVote: VoteType;
};

export type CreateCommentPayload = {
 userId: number;
 targetId: number;
 parentId: number | null;
 content: string;
};

const client = axios.create({
 baseURL: communityApiBaseUrl,
 headers: {
 "Content-Type": "application/json",
 },
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
 const token = localStorage.getItem("access_token");

 if (token) {
 config.headers.Authorization = `Bearer ${token}`;
 }

 return config;
});

export const fetchCommentsByExam = async (
 examId: number,
): Promise<CommentNode[]> => {
 const response = await client.get<CommentNode[]>(`/comments/exam/${examId}`);
 return response.data;
};

export const createComment = async (payload: CreateCommentPayload) => {
 const response = await client.post("/comments", payload);
 return response.data;
};

export type VotePayload = { voteType: VoteType };
export type PinPayload = { pinned: boolean };

export const voteComment = async (commentId: number, payload: VotePayload) => {
 const response = await client.post<CommentNode>(
 `/comments/${commentId}/vote`,
 payload,
 );
 return response.data;
};

export const pinComment = async (commentId: number, payload: PinPayload) => {
 const response = await client.post<CommentNode>(
 `/comments/${commentId}/pin`,
 payload,
 );
 return response.data;
};

export default client;
