import type { AchievementView, GamificationOverview, Sm2ExamDeck } from '../api/studyClient';

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  onClick: () => void | Promise<void>;
};

export function buildSyntheticUserNotifications(
  overview: GamificationOverview | null,
  examDecks: Sm2ExamDeck[] | null,
  navigateTo: (path: string) => void,
): NotificationItem[] {
  const nowMs = Date.now();
  const syntheticItems: NotificationItem[] = [];

  // 1. SM-2 notifications: one per deck with wrong questions
  if (Array.isArray(examDecks)) {
    examDecks.forEach((deck) => {
      if (deck.wrongQuestionCount > 0) {
        syntheticItems.push({
          id: `synthetic-sm2-due-attempt-${deck.latestAttemptId}`,
          title: 'Đến thời gian ôn tập SM-2',
          description: `Bạn có ${deck.wrongQuestionCount} câu đến hạn cần ôn tập (lần thi ${deck.attemptNumber ?? '?'}, ${deck.examTitle}).`,
          timeLabel: deck.latestSubmittedAt
            ? new Date(deck.latestSubmittedAt).toLocaleString('vi-VN')
            : 'Hôm nay',
          onClick: () => navigateTo('/dashboard/spaced-repetition'),
        });
      }
    });
  }

  // 2. Achievements unlocked in last 24h (no duplicates)
  const fromNewlyUnlocked = Array.isArray(overview?.newlyUnlockedAchievements)
    ? overview.newlyUnlockedAchievements
    : [];
  const fromRecentUnlocked = Array.isArray(overview?.recentUnlockedAchievements)
    ? overview.recentUnlockedAchievements.filter((achievement) => {
      if (!achievement.unlockedAt) return false;
      const unlockedAtMs = new Date(achievement.unlockedAt).getTime();
      return Number.isFinite(unlockedAtMs) && nowMs - unlockedAtMs <= TWENTY_FOUR_HOURS_MS;
    })
    : [];
  const mergedAchievements = new Map<string, AchievementView>();
  [...fromNewlyUnlocked, ...fromRecentUnlocked].forEach((achievement) => {
    const key = `${achievement.code}:${achievement.unlockedAt ?? ''}`;
    if (!mergedAchievements.has(key)) {
      mergedAchievements.set(key, achievement);
    }
  });
  mergedAchievements.forEach((achievement) => {
    const unlockedToken = achievement.unlockedAt ?? 'unknown-time';
    syntheticItems.push({
      id: `synthetic-achievement-${achievement.code}-${unlockedToken}`,
      title: 'Bạn vừa mở khóa huy hiệu mới',
      description: achievement.name,
      timeLabel: achievement.unlockedAt
        ? new Date(achievement.unlockedAt).toLocaleString('vi-VN')
        : 'Mới đạt',
      onClick: () => navigateTo('/dashboard/gamification'),
    });
  });

  // 3. Streak notification
  const todayToken = new Date().toISOString().slice(0, 10);
  if (overview?.justQualifiedToday) {
    syntheticItems.push({
      id: `synthetic-streak-qualified-${todayToken}`,
      title: 'Bạn vừa đạt streak hôm nay',
      description: `Streak hiện tại: ${overview.streakDays} ngày liên tiếp.`,
      timeLabel: 'Hôm nay',
      onClick: () => navigateTo('/dashboard/gamification'),
    });
  }

  return syntheticItems;
}
