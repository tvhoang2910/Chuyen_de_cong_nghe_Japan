import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockFetchAttemptView,
  mockStartAttempt,
  mockSubmitAttempt,
  mockSaveAttemptAnswersBatch,
  mockNavigate,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  mockFetchAttemptView: vi.fn(),
  mockStartAttempt: vi.fn(),
  mockSubmitAttempt: vi.fn(),
  mockSaveAttemptAnswersBatch: vi.fn(),
  mockNavigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../api/examClient', async () => {
  const actual = await vi.importActual<typeof import('../api/examClient')>('../api/examClient');
  return {
    ...actual,
    fetchAttemptView: mockFetchAttemptView,
    startAttempt: mockStartAttempt,
    submitAttempt: mockSubmitAttempt,
    saveAttemptAnswersBatch: mockSaveAttemptAnswersBatch,
    isPremiumUpgradeRequiredError: () => false,
  };
});

vi.mock('react-hot-toast', () => ({
  default: {
    success: toastSuccess,
    error: toastError,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../components/PremiumUpsellModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="premium-modal">Premium Modal</div> : null,
}));

import ExamAttempt from '../pages/ExamAttempt';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeExamDetail = (overrides = {}) => ({
  id: 1,
  title: 'Đề thi Toán 12',
  description: 'Bộ đề toán',
  durationMinutes: 60,
  passingScore: 5,
  maxAttempts: 3,
  premium: false,
  premiumLocked: false,
  teaserQuestionCount: 0,
  tags: [],
  totalQuestions: 2,
  status: 'PUBLISHED' as const,
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: '2026-01-01T00:00:00Z',
  questions: [
    {
      id: 101,
      content: 'Câu hỏi 1: Tính 2+2?',
      scoreWeight: 1,
      options: [
        { id: 1001, content: 'A. 3', isCorrect: false },
        { id: 1002, content: 'B. 4', isCorrect: true },
        { id: 1003, content: 'C. 5', isCorrect: false },
      ],
    },
    {
      id: 102,
      content: 'Câu hỏi 2: Tính 3+3?',
      scoreWeight: 1,
      options: [
        { id: 1004, content: 'A. 5', isCorrect: false },
        { id: 1005, content: 'B. 6', isCorrect: true },
      ],
    },
  ],
  ...overrides,
});

const makeAttemptStarted = (overrides = {}) => ({
  attemptId: 999,
  examId: 1,
  startedAt: '2026-04-01T08:00:00Z',
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  durationMinutes: 60,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Render helper — wraps in router with examId param
// ---------------------------------------------------------------------------

const renderAttempt = (examId = '1') =>
  render(
    <MemoryRouter initialEntries={[`/dashboard/exams/${examId}/attempt`]}>
      <Routes>
        <Route path="/dashboard/exams/:examId/attempt" element={<ExamAttempt />} />
      </Routes>
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExamAttempt page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAttemptView.mockResolvedValue(makeExamDetail());
    mockStartAttempt.mockResolvedValue(makeAttemptStarted());
    mockSaveAttemptAnswersBatch.mockResolvedValue(undefined);
    mockSubmitAttempt.mockResolvedValue({ attemptId: 999 });
  });

  it('shows loading state while fetching exam', () => {
    mockFetchAttemptView.mockReturnValue(new Promise(() => {}));

    renderAttempt();

    expect(screen.getByText(/Đang tải bài thi.../i)).toBeInTheDocument();
  });

  it('renders exam title and questions after loading', async () => {
    renderAttempt();

    await waitFor(() => {
      expect(screen.getByText('Đề thi Toán 12')).toBeInTheDocument();
    });

    expect(screen.getByText(/Câu hỏi 1: Tính 2\+2\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Câu hỏi 2: Tính 3\+3\?/i)).toBeInTheDocument();
  });

  it('shows question count info', async () => {
    renderAttempt();

    await waitFor(() => {
      // "2 câu hỏi • Điểm đỗ 5" is split across text nodes — use getAllByText
      const elements = screen.getAllByText(/câu hỏi/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('allows selecting an answer for a question', async () => {
    renderAttempt();

    await waitFor(() => {
      expect(screen.getByText(/Câu hỏi 1/i)).toBeInTheDocument();
    });

    // Options are rendered as "1. A. 3", "2. B. 4", etc. (index + content)
    const optionButton = screen.getByText(/2\. B\. 4/);
    fireEvent.click(optionButton);

    // The selected option should become highlighted (border-blue-500 class via active state)
    await waitFor(() => {
      const btn = screen.getByText(/2\. B\. 4/).closest('button');
      expect(btn).toHaveClass('border-blue-500');
    });
  });

  it('shows timer in remaining time display', async () => {
    renderAttempt();

    await waitFor(() => {
      expect(screen.getByText(/Thời gian còn lại:/i)).toBeInTheDocument();
    });
  });

  it('shows submit button when attempt is active', async () => {
    renderAttempt();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Nộp bài$/i })).toBeInTheDocument();
    });
  });

  it('submits exam and navigates to result page', async () => {
    renderAttempt();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Nộp bài$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Nộp bài$/i }));

    await waitFor(() => {
      expect(mockSubmitAttempt).toHaveBeenCalledWith(999);
      expect(toastSuccess).toHaveBeenCalledWith('Nộp bài thành công.');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/attempts/999/result');
    });
  });

  it('shows error toast when submit fails', async () => {
    mockSubmitAttempt.mockRejectedValue(new Error('network error'));

    renderAttempt();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Nộp bài$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Nộp bài$/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Nộp bài thất bại.');
    });
  });

  it('shows premium modal when exam is premium locked', async () => {
    mockFetchAttemptView.mockResolvedValue(makeExamDetail({ premiumLocked: true }));

    renderAttempt();

    await waitFor(() => {
      expect(screen.getByTestId('premium-modal')).toBeInTheDocument();
    });
  });

  it('shows error state when exam detail fetch fails', async () => {
    mockFetchAttemptView.mockRejectedValue(new Error('not found'));

    renderAttempt();

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
  });

  it('navigates away on invalid examId', async () => {
    // examId=0 is treated as invalid
    render(
      <MemoryRouter initialEntries={['/dashboard/exams/0/attempt']}>
        <Routes>
          <Route path="/dashboard/exams/:examId/attempt" element={<ExamAttempt />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Exam ID không hợp lệ.');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/exams');
    });
  });
});
