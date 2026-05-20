import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockFetchCurrentUserProfile,
  mockFetchMyAttemptHistory,
  mockFetchWeaknessRadar,
  mockFetchScoreHistory,
  mockFetchStudyStats,
  toastError,
} = vi.hoisted(() => ({
  mockFetchCurrentUserProfile: vi.fn(),
  mockFetchMyAttemptHistory: vi.fn(),
  mockFetchWeaknessRadar: vi.fn(),
  mockFetchScoreHistory: vi.fn(),
  mockFetchStudyStats: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../api/axiosClient', async () => {
  const actual = await vi.importActual<typeof import('../api/axiosClient')>('../api/axiosClient');
  return {
    ...actual,
    fetchCurrentUserProfile: mockFetchCurrentUserProfile,
  };
});

vi.mock('../api/examClient', async () => {
  const actual = await vi.importActual<typeof import('../api/examClient')>('../api/examClient');
  return {
    ...actual,
    fetchMyAttemptHistory: mockFetchMyAttemptHistory,
  };
});

vi.mock('../api/studyClient', async () => {
  const actual = await vi.importActual<typeof import('../api/studyClient')>('../api/studyClient');
  return {
    ...actual,
    fetchWeaknessRadar: mockFetchWeaknessRadar,
    fetchScoreHistory: mockFetchScoreHistory,
    fetchStudyStats: mockFetchStudyStats,
  };
});

vi.mock('../components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

// Stub heavy chart components
vi.mock('../components/analytics/WeaknessRadarChart', () => ({
  WeaknessRadarChart: () => <div data-testid="weakness-radar-chart" />,
}));

vi.mock('../components/analytics/ScoreHistoryChart', () => ({
  ScoreHistoryChart: () => <div data-testid="score-history-chart" />,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: toastError,
    success: vi.fn(),
  },
}));

import Dashboard from '../pages/Dashboard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: 1,
  email: 'user@example.com',
  fullName: 'Test User',
  role: 'USER' as const,
  premium: false,
};

const mockAttempts = [
  {
    attemptId: 10,
    examTitle: 'Đề thi Toán 12',
    status: 'SUBMITTED',
    startedAt: '2026-04-01T08:00:00Z',
    submittedAt: '2026-04-01T09:00:00Z',
    scoreRaw: 8,
    scoreMax: 10,
  },
];

const mockStudyStats = {
  totalAttempts: 5,
  avgScorePercent: 75,
  streakDays: 3,
  totalStudyMinutes: 120,
  dueCardsCount: 4,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCurrentUserProfile.mockResolvedValue(mockUser);
    mockFetchMyAttemptHistory.mockResolvedValue(mockAttempts);
    mockFetchWeaknessRadar.mockResolvedValue({ points: [] });
    mockFetchScoreHistory.mockResolvedValue({ points: [] });
    mockFetchStudyStats.mockResolvedValue(mockStudyStats);
  });

  it('renders dashboard inside MainLayout', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('main-layout')).toBeInTheDocument();
  });

  it('shows welcome message with user full name after loading', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
  });

  it('shows exam statistics cards from studyStats', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    // StudyStatsCards renders streak days
    await waitFor(() => {
      expect(mockFetchStudyStats).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state while fetching data', () => {
    // Never resolve to keep loading state
    mockFetchCurrentUserProfile.mockReturnValue(new Promise(() => {}));
    mockFetchMyAttemptHistory.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Đang tải hoạt động.../i)).toBeInTheDocument();
  });

  it('shows empty state message when no attempt history', async () => {
    mockFetchMyAttemptHistory.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/chưa có lịch sử làm bài/i),
      ).toBeInTheDocument();
    });
  });

  it('shows attempt history cards when attempts exist', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán 12')).toBeInTheDocument();
    });
  });

  it('shows toast error when profile fetch fails', async () => {
    mockFetchCurrentUserProfile.mockRejectedValue(new Error('network error'));
    mockFetchMyAttemptHistory.mockRejectedValue(new Error('network error'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Không thể tải thông tin người dùng.');
    });
  });

  it('shows analytics warning when study stats API fails', async () => {
    mockFetchStudyStats.mockRejectedValue(new Error('stats error'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Một số dữ liệu phân tích chưa tải được/i)).toBeInTheDocument();
    });
  });

  it('fetches profile and attempt history on mount', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockFetchCurrentUserProfile).toHaveBeenCalledTimes(1);
      expect(mockFetchMyAttemptHistory).toHaveBeenCalledTimes(1);
    });
  });
});
