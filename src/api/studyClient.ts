import axios from 'axios';

import { studyApiBaseUrl } from '../config/env';

const studyClient = axios.create({
  baseURL: studyApiBaseUrl,
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

export type AchievementCode = string;

export type AchievementView = {
  code: AchievementCode;
  name: string;
  description: string;
  icon: string;
  groupName: string;
  points: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type CalendarDay = {
  date: string;
  activityCompleted: boolean;
  streakQualified: boolean;
};

export type StreakCalendar = {
  month: string;
  totalDays: number;
  activityDays: number;
  qualifiedDays: number;
  days: CalendarDay[];
};

export type GamificationOverview = {
  streakDays: number;
  longestStreak: number;
  dailyStudyMinutes: number;
  dailyTargetMinutes: number;
  todayQualified: boolean;
  justQualifiedToday: boolean;
  points: number;
  newlyUnlockedAchievements: AchievementView[];
  recentUnlockedAchievements: AchievementView[];
};

export type LeaderboardEntry = {
  rank: number;
  userId: number;
  displayName: string;
  points: number;
  streakDays: number;
  unlockedAchievements: number;
  currentUser: boolean;
};

export type AchievementDefinition = {
  code: string;
  name: string;
  description: string;
  icon: string;
  groupName: string;
  points: number;
  active: boolean;
  autoUnlockRule: string | null;
  ruleType: string | null;
  ruleThreshold: number | null;
  ruleThresholdSecondary: number | null;
  ruleConfigJson: string | null;
};

export type AdminAchievementUpsertRequest = {
  code: string;
  name: string;
  description: string;
  icon: string;
  groupName: string;
  points: number;
  active: boolean;
  autoUnlockRule?: string | null;
  ruleType?: string | null;
  ruleThreshold?: number | null;
  ruleThresholdSecondary?: number | null;
  ruleConfigJson?: string | null;
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
  attemptNumber?: number;
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

export const fetchGamificationOverview = async (): Promise<GamificationOverview> => {
  const res = await studyClient.get<GamificationOverview>('/gamification/me/overview');
  return res.data;
};

export const fetchGamificationAchievements = async (): Promise<AchievementView[]> => {
  const res = await studyClient.get<AchievementView[]>('/gamification/me/achievements');
  return res.data;
};

export const fetchGamificationCalendar = async (month?: string): Promise<StreakCalendar> => {
  const res = await studyClient.get<StreakCalendar>('/gamification/me/calendar', {
    params: month ? { month } : undefined,
  });
  return res.data;
};

export const fetchGamificationLeaderboard = async (limit = 10): Promise<LeaderboardEntry[]> => {
  const res = await studyClient.get<LeaderboardEntry[]>('/gamification/me/leaderboard', {
    params: { limit },
  });
  return res.data;
};

export const markGamificationShared = async (): Promise<void> => {
  await studyClient.post('/gamification/me/share');
};

export const fetchAdminGamificationAchievements = async (): Promise<AchievementDefinition[]> => {
  const res = await studyClient.get<AchievementDefinition[]>('/gamification/admin/achievements');
  return res.data;
};

export const createAdminGamificationAchievement = async (
  payload: AdminAchievementUpsertRequest,
): Promise<AchievementDefinition> => {
  const res = await studyClient.post<AchievementDefinition>('/gamification/admin/achievements', payload);
  return res.data;
};

export const updateAdminGamificationAchievement = async (
  code: string,
  payload: Omit<AdminAchievementUpsertRequest, 'code'>,
): Promise<AchievementDefinition> => {
  const res = await studyClient.put<AchievementDefinition>(`/gamification/admin/achievements/${code}`, payload);
  return res.data;
};

export const deleteAdminGamificationAchievement = async (code: string): Promise<void> => {
  await studyClient.delete(`/gamification/admin/achievements/${code}`);
};

export const assignAdminGamificationAchievementToUser = async (code: string, userId: number): Promise<void> => {
  await studyClient.post(`/gamification/admin/achievements/${code}/assign`, { userId });
};
