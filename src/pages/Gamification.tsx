import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Compass,
  Crown,
  Flame,
  Flag,
  Heart,
  Library,
  Medal,
  Megaphone,
  Moon,
  RefreshCcw,
  Share2,
  Sparkles,
  Sword,
  Target,
  Trophy,
  Unlock,
  Lock,
  X,
  Zap,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import {
  fetchGamificationAchievements,
  fetchGamificationCalendar,
  fetchGamificationLeaderboard,
  fetchGamificationOverview,
  markGamificationShared,
  type AchievementView,
  type GamificationOverview,
  type LeaderboardEntry,
  type StreakCalendar,
} from '../api/studyClient';

const toMonthString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const iconByCode: Record<string, React.ReactNode> = {
  TOP_SCORER: <Crown className="h-4 w-4" />,
  FIRST_COMPLETION: <Flag className="h-4 w-4" />,
  SPEED_DEMON: <Zap className="h-4 w-4" />,
  SHARPSHOOTER: <Target className="h-4 w-4" />,
  SCHOLAR: <BookOpen className="h-4 w-4" />,
  NIGHT_GRINDER: <Moon className="h-4 w-4" />,
  WEEKEND_WARRIOR: <Sword className="h-4 w-4" />,
  STREAK_FIRE: <Flame className="h-4 w-4" />,
  BOOKWORM: <Library className="h-4 w-4" />,
  PERSISTENT: <RefreshCcw className="h-4 w-4" />,
  INSPIRER: <Heart className="h-4 w-4" />,
  EXPLORER: <Compass className="h-4 w-4" />,
  LEARNING_AMBASSADOR: <Megaphone className="h-4 w-4" />,
  NIGHT_OWL: <Moon className="h-4 w-4" />,
  EXAM_DESTROYER: <Sword className="h-4 w-4" />,
  ANSWER_INSPECTOR: <Target className="h-4 w-4" />,
};

const SEEDED_NAME_OVERRIDES: Record<string, string> = {
  CUMULATIVE_EXAM_ATTEMPTS_3: 'Khởi động thi cử',
  CUMULATIVE_EXAM_ATTEMPTS_10: 'Bền bỉ luyện tập',
  CUMULATIVE_STUDY_MINUTES_60: 'Nạp năng lượng',
  CUMULATIVE_STUDY_MINUTES_180: 'Cỗ máy học tập',
  STREAK_DAYS_5: 'Giữ nhịp học',
  STREAK_DAYS_14: 'Kỷ luật thép',
  QUALITY_MIN_SCORE_85_X1: 'Đánh dấu xuất sắc',
  QUALITY_MIN_SCORE_90_X3: 'Phong độ cao',
  COMPOUND_AND_STUDY_SCORE: 'Toàn tâm toàn lực',
  COMPOUND_OR_STREAK_QUALITY: 'Bùng nổ năng lực',
};

const SEEDED_DESCRIPTION_OVERRIDES: Record<string, string> = {
  CUMULATIVE_EXAM_ATTEMPTS_3: 'Hoàn thành 3 bài thi.',
  CUMULATIVE_EXAM_ATTEMPTS_10: 'Hoàn thành 10 bài thi.',
  CUMULATIVE_STUDY_MINUTES_60: 'Học đủ 60 phút trong ngày.',
  CUMULATIVE_STUDY_MINUTES_180: 'Học đủ 180 phút trong ngày.',
  STREAK_DAYS_5: 'Duy trì streak 5 ngày liên tiếp.',
  STREAK_DAYS_14: 'Duy trì streak 14 ngày liên tiếp.',
  QUALITY_MIN_SCORE_85_X1: 'Đạt từ 85% ít nhất 1 lần.',
  QUALITY_MIN_SCORE_90_X3: 'Đạt từ 90% ít nhất 3 lần.',
  COMPOUND_AND_STUDY_SCORE: 'Học đủ 120 phút và đạt từ 85% ít nhất 1 lần.',
  COMPOUND_OR_STREAK_QUALITY: 'Streak từ 10 ngày hoặc đạt từ 90% ít nhất 2 lần.',
};

const GROUP_NAME_OVERRIDES: Record<string, string> = {
  'Tich luy': 'Tích lũy',
  Chuoi: 'Chuỗi',
  'Chat luong': 'Chất lượng',
  'Ket hop': 'Kết hợp',
};

const groupOrder = ['Tích lũy', 'Chuỗi', 'Chất lượng', 'Kết hợp', 'Học thuật', 'Chuyên cần', 'Cộng đồng', 'Khác'];

const groupStyles: Record<string, { ring: string; bg: string; chip: string }> = {
  'Học thuật': {
    ring: 'ring-indigo-200',
    bg: 'from-indigo-500/20 via-sky-500/10 to-cyan-500/20',
    chip: 'bg-indigo-100 text-indigo-700',
  },
  'Chuyên cần': {
    ring: 'ring-orange-200',
    bg: 'from-orange-500/20 via-amber-500/10 to-yellow-500/20',
    chip: 'bg-orange-100 text-orange-700',
  },
  'Cộng đồng': {
    ring: 'ring-rose-200',
    bg: 'from-rose-500/20 via-pink-500/10 to-fuchsia-500/20',
    chip: 'bg-rose-100 text-rose-700',
  },
  'Tích lũy': {
    ring: 'ring-blue-200',
    bg: 'from-sky-500/20 via-blue-500/10 to-cyan-500/20',
    chip: 'bg-sky-100 text-sky-700',
  },
  Chuỗi: {
    ring: 'ring-orange-200',
    bg: 'from-orange-500/20 via-amber-500/10 to-yellow-500/20',
    chip: 'bg-orange-100 text-orange-700',
  },
  'Chất lượng': {
    ring: 'ring-emerald-200',
    bg: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/20',
    chip: 'bg-emerald-100 text-emerald-700',
  },
  'Kết hợp': {
    ring: 'ring-violet-200',
    bg: 'from-violet-500/20 via-fuchsia-500/10 to-pink-500/20',
    chip: 'bg-violet-100 text-violet-700',
  },
  Khác: {
    ring: 'ring-slate-200',
    bg: 'from-slate-500/20 via-slate-400/10 to-slate-300/20',
    chip: 'bg-slate-100 text-slate-700',
  },
};

const USER_FULL_NAME_STORAGE_KEY = 'user_full_name';

const getCurrentUserDisplayName = (): string | null => {
  const raw = localStorage.getItem(USER_FULL_NAME_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const normalized = raw.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
};

const resolveLeaderboardDisplayName = (entry: LeaderboardEntry): string => {
  if (!entry.currentUser) {
    return entry.displayName;
  }

  if (entry.displayName.startsWith('Bạn (')) {
    return entry.displayName;
  }

  const currentUserDisplayName = getCurrentUserDisplayName();
  if (!currentUserDisplayName) {
    return entry.displayName;
  }

  return `Bạn (${currentUserDisplayName})`;
};

const normalizeAchievementView = (achievement: AchievementView): AchievementView => ({
  ...achievement,
  name: SEEDED_NAME_OVERRIDES[achievement.code] ?? achievement.name,
  description: SEEDED_DESCRIPTION_OVERRIDES[achievement.code] ?? achievement.description,
  groupName: GROUP_NAME_OVERRIDES[achievement.groupName] ?? achievement.groupName,
});

const badgeEmojiByCode: Record<string, string> = {
  TOP_SCORER: '👑',
  FIRST_COMPLETION: '🚩',
  SPEED_DEMON: '⚡',
  SHARPSHOOTER: '🎯',
  SCHOLAR: '📘',
  NIGHT_GRINDER: '🌙',
  WEEKEND_WARRIOR: '🗡️',
  STREAK_FIRE: '🔥',
  BOOKWORM: '📚',
  PERSISTENT: '♻️',
  INSPIRER: '💖',
  EXPLORER: '🧭',
  LEARNING_AMBASSADOR: '📣',
  NIGHT_OWL: '🦉',
  EXAM_DESTROYER: '💥',
  ANSWER_INSPECTOR: '🔍',
};

const Gamification: React.FC = () => {
  const [overview, setOverview] = useState<GamificationOverview | null>(null);
  const [achievements, setAchievements] = useState<AchievementView[]>([]);
  const [calendar, setCalendar] = useState<StreakCalendar | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthString(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedBadges, setExpandedBadges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [overviewRes, achievementsRes, calendarRes, leaderboardRes] = await Promise.allSettled([
          fetchGamificationOverview(),
          fetchGamificationAchievements(),
          fetchGamificationCalendar(selectedMonth),
          fetchGamificationLeaderboard(10),
        ]);

        if (overviewRes.status === 'fulfilled') {
          setOverview(overviewRes.value);
          if (overviewRes.value.justQualifiedToday) {
            setShowCongrats(true);
          }
        } else {
          toast.error('Không thể tải tổng quan gamification.');
        }

        if (achievementsRes.status === 'fulfilled') {
          setAchievements(achievementsRes.value.map(normalizeAchievementView));
        } else {
          setAchievements([]);
          toast.error('Không thể tải kho thành tựu.');
        }

        if (calendarRes.status === 'fulfilled') {
          setCalendar(calendarRes.value);
        } else {
          setCalendar(null);
          toast.error('Không thể tải lịch streak.');
        }

        if (leaderboardRes.status === 'fulfilled') {
          setLeaderboard(leaderboardRes.value);
        } else {
          setLeaderboard([]);
        }

      } catch {
        toast.error('Không thể tải dữ liệu gamification.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [selectedMonth]);

  const calendarDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map((v) => Number(v));
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const weekdayOffset = useMemo(() => {
    const day = calendarDate.getDay();
    return day === 0 ? 6 : day - 1;
  }, [calendarDate]);

  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const groupedAchievements = useMemo(() => {
    return achievements.reduce<Record<string, AchievementView[]>>((acc, achievement) => {
      const normalizedGroupName = GROUP_NAME_OVERRIDES[achievement.groupName] ?? achievement.groupName;
      const key = normalizedGroupName || 'Khác';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(achievement);
      return acc;
    }, {});
  }, [achievements]);

  const orderedGroups = useMemo(() => {
    const existingGroups = Object.keys(groupedAchievements).filter((name) => !groupOrder.includes(name));
    const merged = [...groupOrder, ...existingGroups].filter((name) => groupedAchievements[name]?.length > 0);
    return merged.filter((name, index) => merged.indexOf(name) === index);
  }, [groupedAchievements]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const toggleBadge = (code: string) => {
    setExpandedBadges((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handleShare = async (achievement: AchievementView) => {
    const shareText = `Mình vừa mở khóa huy hiệu ${achievement.name} trên ExamBank!`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Thành tựu ExamBank',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Đã sao chép nội dung chia sẻ.');
      }

      await markGamificationShared();
      setAchievements((prev) => prev.map((item) => (
        item.code === 'LEARNING_AMBASSADOR' ? { ...item, unlocked: true } : item
      )));
    } catch {
      toast.error('Không thể chia sẻ lúc này.');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-orange-200 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl shadow-orange-500/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <Trophy className="h-4 w-4" />
                Gamification
              </div>
              <h1 className="mt-3 text-2xl font-bold">Giữ lửa học tập mỗi ngày</h1>
              <p className="mt-1 max-w-xl text-orange-100">
                Học tối thiểu {overview?.dailyTargetMinutes ?? 15} phút mỗi ngày để duy trì streak và mở khóa huy hiệu.
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 text-right backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-orange-100">Tổng điểm</p>
              <p className="text-3xl font-black">{overview?.points ?? 0}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-orange-100">Streak hiện tại</p>
              <p className="mt-1 text-2xl font-bold">{overview?.streakDays ?? 0} ngày</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-orange-100">Streak cao nhất</p>
              <p className="mt-1 text-2xl font-bold">{overview?.longestStreak ?? 0} ngày</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-orange-100">Tiến độ hôm nay</p>
              <p className="mt-1 text-2xl font-bold">
                {overview?.dailyStudyMinutes ?? 0}/{overview?.dailyTargetMinutes ?? 15} phút
              </p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-orange-100">Đã mở khóa</p>
              <p className="mt-1 text-2xl font-bold">{unlockedCount}/{achievements.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Bảng xếp hạng học tập</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              <Award className="h-3.5 w-3.5" /> Top {leaderboard.length || 10}
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu xếp hạng.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={`${entry.userId}-${entry.rank}`}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 ${entry.currentUser
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-200 bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${entry.rank <= 3
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 text-slate-700'}`}
                    >
                      {entry.rank}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{resolveLeaderboardDisplayName(entry)}</p>
                      <p className="text-xs text-slate-500">Streak {entry.streakDays} ngày • {entry.unlockedAchievements} huy hiệu</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-slate-800">{entry.points} điểm</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Đang tải dữ liệu gamification...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Lịch streak theo tháng</h2>
                  <p className="text-sm text-slate-500">Chấm tròn màu cam là ngày đạt mục tiêu streak.</p>
                </div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => (
                  <div key={label}>{label}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {Array.from({ length: weekdayOffset }).map((_, index) => (
                  <div key={`blank-${index}`} className="h-10" />
                ))}

                {calendar?.days.map((day) => {
                  const dayNumber = new Date(day.date).getDate();
                  const baseClass = day.streakQualified
                    ? 'bg-orange-500 text-white border-orange-500'
                    : day.activityCompleted
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200';

                  return (
                    <div
                      key={day.date}
                      className={`flex h-10 items-center justify-center rounded-lg border text-sm font-bold ${baseClass}`}
                      title={day.streakQualified ? 'Đạt streak' : day.activityCompleted ? 'Đã học trong ngày' : 'Chưa học'}
                    >
                      {dayNumber}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500" /> Đạt streak</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-200" /> Có học tập</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-200" /> Chưa học</span>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Trạng thái hôm nay</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                  <p className="text-xs uppercase tracking-wider text-orange-700">Streak</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-orange-900">
                    <Flame className="h-5 w-5" />
                    {overview?.streakDays ?? 0} ngày
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-700">Tiến độ</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {(overview?.todayQualified ?? false)
                      ? 'Bạn đã đạt mục tiêu streak hôm nay.'
                      : `Cần thêm ${Math.max((overview?.dailyTargetMinutes ?? 15) - (overview?.dailyStudyMinutes ?? 0), 0)} phút học để giữ streak.`}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Kho thành tựu</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <Medal className="h-4 w-4" /> {unlockedCount}/{achievements.length} đã mở khóa
            </span>
          </div>

          <div className="space-y-6">
            {orderedGroups.map((groupName) => (
              <div key={groupName}>
                {(() => {
                  const style = groupStyles[groupName] || groupStyles.Khác;
                  const isCollapsed = collapsedGroups[groupName] ?? groupName === 'Khác';
                  const unlockedInGroup = groupedAchievements[groupName].filter((item) => item.unlocked).length;
                  const totalInGroup = groupedAchievements[groupName].length;

                  return (
                    <>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">{groupName}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.chip}`}>
                      {unlockedInGroup}/{totalInGroup} đã mở khóa
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupName)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    {isCollapsed ? 'Mở ra' : 'Thu gọn'}
                  </button>
                </div>

                {!isCollapsed && (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupedAchievements[groupName].map((achievement) => (
                    <article
                      key={achievement.code}
                      className={`group relative overflow-hidden rounded-2xl border p-4 transition ${achievement.unlocked
                        ? `bg-gradient-to-br ${style.bg} border-white/70 shadow-sm`
                        : 'border-slate-200 bg-slate-100/70 grayscale'}`}
                    >
                      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-md ${achievement.unlocked ? 'opacity-100 animate-pulse' : 'opacity-40'}`} />

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                            {iconByCode[achievement.code] || <CalendarDays className="h-4 w-4" />}
                          </div>
                          <span className="text-xl leading-none">{badgeEmojiByCode[achievement.code] || '🏅'}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600">
                          <Sparkles className="h-3 w-3" /> +{achievement.points}
                        </span>
                      </div>
                      <h4 className="mt-3 font-bold text-slate-900">{achievement.name}</h4>

                      {expandedBadges[achievement.code] && (
                        <div
                          className={`mt-2 rounded-xl border px-3 py-2 text-sm ${achievement.unlocked
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                        >
                          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Yêu cầu mở khóa</p>
                          <p className="mt-1 leading-relaxed">{achievement.description}</p>
                        </div>
                      )}

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70">
                        <div
                          className={`h-full rounded-full transition-all ${achievement.unlocked ? 'bg-emerald-500 w-full' : 'bg-slate-400 w-1/3'}`}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className={`text-xs font-semibold ${achievement.unlocked ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {achievement.unlocked ? (
                            <span className="inline-flex items-center gap-1"><Unlock className="h-3.5 w-3.5" /> Đã mở khóa</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Chưa mở khóa</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleBadge(achievement.code)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition ${achievement.unlocked
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
                          >
                            {expandedBadges[achievement.code] ? (
                              <><ChevronUp className="h-3.5 w-3.5" /> Ẩn yêu cầu</>
                            ) : (
                              <><ChevronDown className="h-3.5 w-3.5" /> Yêu cầu</>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleShare(achievement)}
                            disabled={!achievement.unlocked}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Share2 className="h-3.5 w-3.5" /> Chia sẻ
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                )}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </section>
      </div>

      {showCongrats && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-3xl border border-orange-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Flame className="h-6 w-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowCongrats(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">Chúc mừng bạn đã giữ streak hôm nay!</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn vừa đạt {overview?.dailyTargetMinutes ?? 15} phút học và tăng streak lên {overview?.streakDays ?? 0} ngày.
            </p>
            <button
              type="button"
              onClick={() => setShowCongrats(false)}
              className="mt-5 w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
            >
              Tiếp tục học tập
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Gamification;
