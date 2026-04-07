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

export type DueStudyCard = {
  cardId: number;
  itemId: number;
  nextReviewAt: string;
  repetition: number;
  intervalDays: number;
  easinessFactor: number;
  lastQuality: number | null;
  lastIsCorrect: boolean | null;
  totalReviews: number;
  correctReviews: number;
  topicTagIds: string | null;
};

export type DueCardsResponse = {
  generatedAt: string;
  dueCount: number;
  limit: number;
  cards: DueStudyCard[];
};

export type ManualReviewResponse = {
  cardId: number;
  itemId: number;
  quality: number;
  repetition: number;
  intervalDays: number;
  easinessFactor: number;
  nextReviewAt: string;
};

export type Sm2DeckQuestion = {
  itemId: number;
  topicTagIds: string | null;
  selectedOptionIds: string | null;
  correctOptionIds: string | null;
  repetition: number;
  intervalDays: number;
  easinessFactor: number;
  nextReviewAt: string;
  dueNow: boolean;
  totalReviews: number;
  correctReviews: number;
};

export type Sm2ExamDeck = {
  examId: number;
  examTitle: string;
  latestAttemptId: number;
  latestSubmittedAt: string;
  wrongQuestionCount: number;
  questions: Sm2DeckQuestion[];
};

export type Sm2ExamDecksResponse = {
  generatedAt: string;
  deckCount: number;
  totalWrongQuestions: number;
  decks: Sm2ExamDeck[];
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

export const fetchDueCards = async (limit = 20): Promise<DueCardsResponse> => {
  const res = await studyClient.get<DueCardsResponse>('/spaced-repetition/me/due', {
    params: { limit },
  });
  return res.data;
};

export const fetchExamWrongDecks = async (): Promise<Sm2ExamDecksResponse> => {
  const res = await studyClient.get<Sm2ExamDecksResponse>('/spaced-repetition/me/exam-decks');
  return res.data;
};

export const submitManualReview = async (itemId: number, quality: number): Promise<ManualReviewResponse> => {
  const res = await studyClient.post<ManualReviewResponse>('/spaced-repetition/me/review', {
    itemId,
    isCorrect: quality >= 3,
    responseTimeMs: 0,
    answerChangeCount: 0,
  });
  return res.data;
};

export const submitReviewAnswer = async (
  itemId: number,
  isCorrect: boolean,
  responseTimeMs: number,
  answerChangeCount = 0,
): Promise<ManualReviewResponse> => {
  const res = await studyClient.post<ManualReviewResponse>('/spaced-repetition/me/review', {
    itemId,
    isCorrect,
    responseTimeMs,
    answerChangeCount,
  });
  return res.data;
};
