import axios from "axios";
import { searchApiBaseUrl } from "../config/env";

export type SearchExamDocument = {
  id: number;
  title: string;
  searchTitle?: string;
  status: string;
  isPremium?: boolean;
  tags: string[];
};

export type SearchExamParams = {
  keyword?: string;
  tags?: string[];
};

const searchClient = axios.create({
  baseURL: searchApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

searchClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const buildQueryString = ({ keyword, tags }: SearchExamParams): string => {
  const query = new URLSearchParams();
  const normalizedKeyword = keyword?.trim() ?? "";
  if (normalizedKeyword) {
    query.set("keyword", normalizedKeyword);
  }
  if (Array.isArray(tags)) {
    tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => query.append("tags", tag));
  }
  return query.toString();
};

export const searchExams = async (
  params: SearchExamParams,
): Promise<SearchExamDocument[]> => {
  const query = buildQueryString(params);
  const url = query ? `/exams?${query}` : "/exams";
  const response = await searchClient.get<SearchExamDocument[]>(url);
  return response.data;
};
