import axios from 'axios';

const STUDY_API = import.meta.env.VITE_STUDY_API_BASE_URL || 'http://localhost:8085/api/v1/study';

const studyClient = axios.create({
  baseURL: STUDY_API,
  headers: { 'Content-Type': 'application/json' },
});

studyClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type RadarPoint = {
  tagId: number;
  tagName: string;
  correctRate: number;   // 0–100
  totalQuestions: number;
  correctCount: number;
};

export type WeaknessRadarData = {
  points: RadarPoint[];
};

export type ScorePoint = {
  period: string;           // "2026-03"
  avgScorePercent: number;  // 0–100
  attemptCount: number;
  avgScoreRaw: number;
};

export type ScoreHistoryData = {
  points: ScorePoint[];
};

export type StudyStats = {
  totalAttempts: number;
  avgScorePercent: number;
  streakDays: number;
  totalStudyMinutes: number;
  dueCardsCount: number;
};

// ─── API Calls ────────────────────────────────────────────────────────────────

export const fetchWeaknessRadar = async (): Promise<WeaknessRadarData> => {
  const res = await studyClient.get<WeaknessRadarData>('/analytics/me/weakness-radar');
  return res.data;
};

export const fetchScoreHistory = async (): Promise<ScoreHistoryData> => {
  const res = await studyClient.get<ScoreHistoryData>('/analytics/me/score-history');
  return res.data;
};

export const fetchStudyStats = async (): Promise<StudyStats> => {
  const res = await studyClient.get<StudyStats>('/analytics/me/stats');
  return res.data;
};
