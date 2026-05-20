import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockFetchGamificationOverview,
  mockFetchGamificationAchievements,
  mockFetchGamificationCalendar,
  mockFetchGamificationLeaderboard,
  mockMarkGamificationShared,
  toastError,
  toastSuccess,
} = vi.hoisted(() => ({
  mockFetchGamificationOverview: vi.fn(),
  mockFetchGamificationAchievements: vi.fn(),
  mockFetchGamificationCalendar: vi.fn(),
  mockFetchGamificationLeaderboard: vi.fn(),
  mockMarkGamificationShared: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('../api/studyClient', async () => {
  const actual = await vi.importActual<typeof import('../api/studyClient')>('../api/studyClient');
  return {
    ...actual,
    fetchGamificationOverview: mockFetchGamificationOverview,
    fetchGamificationAchievements: mockFetchGamificationAchievements,
    fetchGamificationCalendar: mockFetchGamificationCalendar,
    fetchGamificationLeaderboard: mockFetchGamificationLeaderboard,
    markGamificationShared: mockMarkGamificationShared,
  };
});

vi.mock('../components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: toastError,
    success: toastSuccess,
  },
}));

import Gamification from '../pages/Gamification';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockOverview = {
  streakDays: 7,
  longestStreak: 14,
  dailyStudyMinutes: 20,
  dailyTargetMinutes: 15,
  todayQualified: true,
  justQualifiedToday: false,
  points: 350,
  newlyUnlockedAchievements: [],
  recentUnlockedAchievements: [],
};

const mockAchievements = [
  {
    code: 'FIRST_COMPLETION',
    name: 'Khởi đầu',
    description: 'Hoàn thành bài thi đầu tiên.',
    icon: 'FLAG',
    groupName: 'Tich luy',
    points: 100,
    unlocked: true,
    unlockedAt: '2026-03-01T10:00:00Z',
  },
  {
    code: 'STREAK_DAYS_5',
    name: 'Giữ nhịp học',
    description: 'Duy trì streak 5 ngày liên tiếp.',
    icon: 'FLAME',
    groupName: 'Chuoi',
    points: 160,
    unlocked: false,
    unlockedAt: null,
  },
];

const mockCalendar = {
  month: '2026-04',
  totalDays: 30,
  activityDays: 7,
  qualifiedDays: 5,
  days: [
    { date: '2026-04-01', activityCompleted: true, streakQualified: true },
    { date: '2026-04-02', activityCompleted: false, streakQualified: false },
  ],
};

const mockLeaderboard = [
  {
    rank: 1,
    userId: 5,
    displayName: 'Leader',
    points: 1000,
    streakDays: 30,
    unlockedAchievements: 8,
    currentUser: false,
  },
  {
    rank: 2,
    userId: 1,
    displayName: 'Bạn (Test User)',
    points: 350,
    streakDays: 7,
    unlockedAchievements: 1,
    currentUser: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderPage = () =>
  render(
    <MemoryRouter>
      <Gamification />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Gamification page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchGamificationOverview.mockResolvedValue(mockOverview);
    mockFetchGamificationAchievements.mockResolvedValue(mockAchievements);
    mockFetchGamificationCalendar.mockResolvedValue(mockCalendar);
    mockFetchGamificationLeaderboard.mockResolvedValue(mockLeaderboard);
  });

  it('shows loading state initially', () => {
    mockFetchGamificationOverview.mockReturnValue(new Promise(() => {}));
    mockFetchGamificationAchievements.mockReturnValue(new Promise(() => {}));
    mockFetchGamificationCalendar.mockReturnValue(new Promise(() => {}));
    mockFetchGamificationLeaderboard.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText(/Đang tải dữ liệu gamification.../i)).toBeInTheDocument();
  });

  it('renders achievements section heading after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Kho thành tựu/i)).toBeInTheDocument();
    });
  });

  it('shows achievements list with unlocked and locked achievements', async () => {
    renderPage();

    await waitFor(() => {
      // Unlocked achievement name
      expect(screen.getByText('Khởi đầu')).toBeInTheDocument();
    });

    // Locked achievement name
    expect(screen.getByText('Giữ nhịp học')).toBeInTheDocument();
  });

  it('shows unlocked count out of total', async () => {
    renderPage();

    await waitFor(() => {
      // 1 unlocked out of 2 total
      expect(screen.getByText(/1\/2 đã mở khóa/i)).toBeInTheDocument();
    });
  });

  it('shows streak days from overview', async () => {
    renderPage();

    await waitFor(() => {
      // "7 ngày" appears in multiple places — just confirm at least one instance renders
      const elements = screen.getAllByText(/7 ngày/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('shows total points from overview', async () => {
    renderPage();

    await waitFor(() => {
      // Points shown in the header card
      expect(screen.getByText('350')).toBeInTheDocument();
    });
  });

  it('shows leaderboard section', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Bảng xếp hạng học tập/i)).toBeInTheDocument();
    });
  });

  it('shows leaderboard entries', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Leader')).toBeInTheDocument();
    });
  });

  it('shows empty leaderboard state when no data', async () => {
    mockFetchGamificationLeaderboard.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Chưa có dữ liệu xếp hạng/i)).toBeInTheDocument();
    });
  });

  it('shows error toast when overview fetch fails', async () => {
    mockFetchGamificationOverview.mockRejectedValue(new Error('network error'));

    renderPage();

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Không thể tải tổng quan gamification.');
    });
  });

  it('shows error toast when achievements fetch fails', async () => {
    mockFetchGamificationAchievements.mockRejectedValue(new Error('network error'));

    renderPage();

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Không thể tải kho thành tựu.');
    });
  });

  it('renders streak calendar section', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Lịch streak theo tháng/i)).toBeInTheDocument();
    });
  });

  it('calls all four gamification API functions on mount', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockFetchGamificationOverview).toHaveBeenCalledTimes(1);
      expect(mockFetchGamificationAchievements).toHaveBeenCalledTimes(1);
      expect(mockFetchGamificationCalendar).toHaveBeenCalledTimes(1);
      expect(mockFetchGamificationLeaderboard).toHaveBeenCalledTimes(1);
    });
  });
});
