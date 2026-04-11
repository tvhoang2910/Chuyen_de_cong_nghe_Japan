import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignAdminGamificationAchievementToUser,
  createAdminGamificationAchievement,
  deleteAdminGamificationAchievement,
  fetchAdminGamificationAchievements,
  fetchDueCards,
  fetchExamWrongDecks,
  fetchGamificationAchievements,
  fetchGamificationCalendar,
  fetchGamificationLeaderboard,
  fetchGamificationOverview,
  fetchScoreHistory,
  fetchStudyStats,
  fetchWeaknessRadar,
  markGamificationShared,
  submitManualReview,
  submitReviewAnswer,
  updateAdminGamificationAchievement,
} from "../api/studyClient";

const getItemMock = vi.fn();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: getItemMock,
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
    },
  },
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => mockClient),
  },
}));

describe("studyClient API", () => {
  beforeEach(() => {
    mockClient.get.mockReset();
    mockClient.post.mockReset();
    mockClient.put.mockReset();
    mockClient.delete.mockReset();
    getItemMock.mockReturnValue(null);
  });

  it("adds bearer token via request interceptor when token exists", () => {
    getItemMock.mockReturnValue("token-123");
    const interceptor = vi
      .mocked(mockClient.interceptors.request.use)
      .mock.calls[0]?.[0] as (config: { headers: Record<string, string> }) => {
      headers: Record<string, string>;
    };

    const config = interceptor({ headers: {} });

    expect(config.headers.Authorization).toBe("Bearer token-123");
  });

  it("does not add authorization header when token is missing", () => {
    const interceptor = vi
      .mocked(mockClient.interceptors.request.use)
      .mock.calls[0]?.[0] as (config: { headers: Record<string, string> }) => {
      headers: Record<string, string>;
    };

    const config = interceptor({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("fetchWeaknessRadar calls expected endpoint", async () => {
    const payload = { points: [{ tagId: 1, tagName: "Math", correctRate: 75, totalQuestions: 20, correctCount: 15 }] };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchWeaknessRadar();

    expect(mockClient.get).toHaveBeenCalledWith("/analytics/me/weakness-radar");
    expect(result).toEqual(payload);
  });

  it("fetchScoreHistory calls expected endpoint", async () => {
    const payload = { points: [{ period: "2026-04", avgScorePercent: 82, attemptCount: 3, avgScoreRaw: 8.2 }] };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchScoreHistory();

    expect(mockClient.get).toHaveBeenCalledWith("/analytics/me/score-history");
    expect(result).toEqual(payload);
  });

  it("fetchStudyStats calls expected endpoint", async () => {
    const payload = {
      totalAttempts: 12,
      avgScorePercent: 77,
      streakDays: 4,
      totalStudyMinutes: 180,
      dueCardsCount: 7,
    };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchStudyStats();

    expect(mockClient.get).toHaveBeenCalledWith("/analytics/me/stats");
    expect(result.totalAttempts).toBe(12);
  });

  it("fetchDueCards uses default limit=20", async () => {
    const payload = { generatedAt: "2026-04-10T09:00:00Z", dueCount: 1, limit: 20, cards: [] };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchDueCards();

    expect(mockClient.get).toHaveBeenCalledWith("/spaced-repetition/me/due", { params: { limit: 20 } });
    expect(result.limit).toBe(20);
  });

  it("fetchDueCards supports custom limit", async () => {
    const payload = { generatedAt: "2026-04-10T09:00:00Z", dueCount: 1, limit: 5, cards: [] };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchDueCards(5);

    expect(mockClient.get).toHaveBeenCalledWith("/spaced-repetition/me/due", { params: { limit: 5 } });
    expect(result.limit).toBe(5);
  });

  it("fetchExamWrongDecks calls expected endpoint", async () => {
    const payload = { generatedAt: "2026-04-10T09:00:00Z", deckCount: 1, totalWrongQuestions: 4, decks: [] };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchExamWrongDecks();

    expect(mockClient.get).toHaveBeenCalledWith("/spaced-repetition/me/exam-decks");
    expect(result.deckCount).toBe(1);
  });

  it("submitManualReview maps quality>=3 to isCorrect=true", async () => {
    const payload = {
      cardId: 1,
      itemId: 99,
      quality: 4,
      repetition: 2,
      intervalDays: 3,
      easinessFactor: 2.5,
      nextReviewAt: "2026-04-11T09:00:00Z",
    };
    mockClient.post.mockResolvedValue({ data: payload });

    const result = await submitManualReview(99, 4);

    expect(mockClient.post).toHaveBeenCalledWith("/spaced-repetition/me/review", {
      itemId: 99,
      isCorrect: true,
      responseTimeMs: 0,
      answerChangeCount: 0,
    });
    expect(result.quality).toBe(4);
  });

  it("submitManualReview maps quality<3 to isCorrect=false", async () => {
    mockClient.post.mockResolvedValue({ data: { cardId: 1, itemId: 99, quality: 1 } });

    await submitManualReview(99, 1);

    expect(mockClient.post).toHaveBeenCalledWith("/spaced-repetition/me/review", {
      itemId: 99,
      isCorrect: false,
      responseTimeMs: 0,
      answerChangeCount: 0,
    });
  });

  it("submitReviewAnswer sends provided answerChangeCount", async () => {
    mockClient.post.mockResolvedValue({ data: { cardId: 2, itemId: 101, quality: 5 } });

    await submitReviewAnswer(101, true, 1500, 2);

    expect(mockClient.post).toHaveBeenCalledWith("/spaced-repetition/me/review", {
      itemId: 101,
      isCorrect: true,
      responseTimeMs: 1500,
      answerChangeCount: 2,
    });
  });

  it("submitReviewAnswer defaults answerChangeCount to 0", async () => {
    mockClient.post.mockResolvedValue({ data: { cardId: 2, itemId: 101, quality: 5 } });

    await submitReviewAnswer(101, false, 800);

    expect(mockClient.post).toHaveBeenCalledWith("/spaced-repetition/me/review", {
      itemId: 101,
      isCorrect: false,
      responseTimeMs: 800,
      answerChangeCount: 0,
    });
  });

  it("fetchGamificationOverview calls expected endpoint", async () => {
    const payload = {
      streakDays: 5,
      longestStreak: 9,
      dailyStudyMinutes: 18,
      dailyTargetMinutes: 15,
      todayQualified: true,
      justQualifiedToday: true,
      points: 930,
      newlyUnlockedAchievements: [],
      recentUnlockedAchievements: [],
    };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchGamificationOverview();

    expect(mockClient.get).toHaveBeenCalledWith("/gamification/me/overview");
    expect(result.points).toBe(930);
  });

  it("fetchGamificationAchievements calls expected endpoint", async () => {
    const payload = [
      {
        code: "SCHOLAR",
        name: "Học bá",
        description: "Học đủ 5 phút trong ngày",
        icon: "BOOK_OPEN",
        groupName: "Học thuật",
        points: 300,
        unlocked: true,
        unlockedAt: "2026-04-10T09:00:00Z",
      },
    ];
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchGamificationAchievements();

    expect(mockClient.get).toHaveBeenCalledWith("/gamification/me/achievements");
    expect(result[0].code).toBe("SCHOLAR");
  });

  it("fetchGamificationCalendar sends month query when provided", async () => {
    const payload = { month: "2026-04", totalDays: 30, activityDays: 4, qualifiedDays: 3, days: [] };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchGamificationCalendar("2026-04");

    expect(mockClient.get).toHaveBeenCalledWith("/gamification/me/calendar", {
      params: { month: "2026-04" },
    });
    expect(result.month).toBe("2026-04");
  });

  it("fetchGamificationCalendar omits params when month is absent", async () => {
    const payload = { month: "2026-04", totalDays: 30, activityDays: 4, qualifiedDays: 3, days: [] };
    mockClient.get.mockResolvedValue({ data: payload });

    await fetchGamificationCalendar();

    expect(mockClient.get).toHaveBeenCalledWith("/gamification/me/calendar", {
      params: undefined,
    });
  });

  it("fetchGamificationLeaderboard uses default limit=10", async () => {
    const payload = [{ rank: 1, userId: 10, displayName: "Nguyễn Văn A", points: 500, streakDays: 3, unlockedAchievements: 2, currentUser: false }];
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchGamificationLeaderboard();

    expect(mockClient.get).toHaveBeenCalledWith("/gamification/me/leaderboard", {
      params: { limit: 10 },
    });
    expect(result).toHaveLength(1);
  });

  it("fetchGamificationLeaderboard supports custom limit", async () => {
    mockClient.get.mockResolvedValue({ data: [] });

    await fetchGamificationLeaderboard(25);

    expect(mockClient.get).toHaveBeenCalledWith("/gamification/me/leaderboard", {
      params: { limit: 25 },
    });
  });

  it("markGamificationShared posts to /gamification/me/share", async () => {
    mockClient.post.mockResolvedValue({ data: undefined });

    await markGamificationShared();

    expect(mockClient.post).toHaveBeenCalledWith("/gamification/me/share");
  });

  it("fetchAdminGamificationAchievements calls expected endpoint", async () => {
    const payload = [
      {
        code: "STREAK_DAYS_5",
        name: "Giữ nhịp học",
        description: "Streak 5 ngày",
        icon: "FLAME",
        groupName: "Chuỗi",
        points: 160,
        active: true,
        autoUnlockRule: null,
        ruleType: "STREAK_DAYS",
        ruleThreshold: 5,
        ruleThresholdSecondary: null,
        ruleConfigJson: null,
      },
    ];
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchAdminGamificationAchievements();

    expect(mockClient.get).toHaveBeenCalledWith("/gamification/admin/achievements");
    expect(result[0].code).toBe("STREAK_DAYS_5");
  });

  it("createAdminGamificationAchievement posts payload to admin endpoint", async () => {
    const payload = {
      code: "CUMULATIVE_EXAM_ATTEMPTS_20",
      name: "Bền bỉ",
      description: "Hoàn thành 20 bài",
      icon: "TROPHY",
      groupName: "Tích lũy",
      points: 220,
      active: true,
      autoUnlockRule: null,
      ruleType: "CUMULATIVE_EXAM_ATTEMPTS",
      ruleThreshold: 20,
      ruleThresholdSecondary: null,
      ruleConfigJson: null,
    };
    mockClient.post.mockResolvedValue({ data: payload });

    const result = await createAdminGamificationAchievement(payload);

    expect(mockClient.post).toHaveBeenCalledWith("/gamification/admin/achievements", payload);
    expect(result.name).toBe("Bền bỉ");
  });

  it("updateAdminGamificationAchievement puts payload to admin code endpoint", async () => {
    const payload = {
      name: "Giữ nhịp học",
      description: "Streak 5 ngày",
      icon: "FLAME",
      groupName: "Chuỗi",
      points: 160,
      active: true,
      autoUnlockRule: null,
      ruleType: "STREAK_DAYS",
      ruleThreshold: 5,
      ruleThresholdSecondary: null,
      ruleConfigJson: null,
    };
    mockClient.put.mockResolvedValue({ data: { code: "STREAK_DAYS_5", ...payload } });

    const result = await updateAdminGamificationAchievement("STREAK_DAYS_5", payload);

    expect(mockClient.put).toHaveBeenCalledWith("/gamification/admin/achievements/STREAK_DAYS_5", payload);
    expect(result.code).toBe("STREAK_DAYS_5");
  });

  it("deleteAdminGamificationAchievement calls delete endpoint", async () => {
    mockClient.delete.mockResolvedValue({ data: undefined });

    await deleteAdminGamificationAchievement("STREAK_DAYS_5");

    expect(mockClient.delete).toHaveBeenCalledWith("/gamification/admin/achievements/STREAK_DAYS_5");
  });

  it("assignAdminGamificationAchievementToUser posts userId payload", async () => {
    mockClient.post.mockResolvedValue({ data: undefined });

    await assignAdminGamificationAchievementToUser("STREAK_DAYS_5", 88);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/gamification/admin/achievements/STREAK_DAYS_5/assign",
      { userId: 88 },
    );
  });
});
