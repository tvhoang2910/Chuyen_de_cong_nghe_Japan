import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  fetchPublicExams,
  type ExamSummary,
} from '../api/examClient';
import {
  fetchExamRatingSummaries,
  type ExamRatingSummary,
} from '../api/examRatingClient';
import PublicExams from '../pages/PublicExams';

vi.mock('../api/examClient', async () => {
  const actual = await vi.importActual<typeof import('../api/examClient')>(
    '../api/examClient',
  );

  return {
    ...actual,
    fetchPublicExams: vi.fn(),
  };
});

vi.mock('../api/examRatingClient', async () => {
  const actual = await vi.importActual<typeof import('../api/examRatingClient')>(
    '../api/examRatingClient',
  );

  return {
    ...actual,
    fetchExamRatingSummaries: vi.fn(),
  };
});

vi.mock('../components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockExams: ExamSummary[] = [
  {
    id: 1,
    title: 'Đề thi Công nghệ & Tin học',
    description: 'Bộ đề cho khối Công nghệ thông tin',
    durationMinutes: 60,
    passingScore: 5,
    maxAttempts: 3,
    premium: false,
    teaserQuestionCount: 0,
    tags: [
      { id: 101, name: 'IT' },
      { id: 102, name: 'Công nghệ' },
    ],
    totalQuestions: 40,
    status: 'PUBLISHED',
    createdAt: '2026-04-18T10:00:00Z',
    modifiedAt: '2026-04-18T10:00:00Z',
  },
  {
    id: 2,
    title: 'Đề thi Toán 12',
    description: 'Đề ôn tập đại số',
    durationMinutes: 90,
    passingScore: 5,
    maxAttempts: 2,
    premium: false,
    teaserQuestionCount: 0,
    tags: [{ id: 201, name: 'Toán' }],
    totalQuestions: 50,
    status: 'PUBLISHED',
    createdAt: '2026-04-19T10:00:00Z',
    modifiedAt: '2026-04-19T10:00:00Z',
  },
  {
    id: 3,
    title: 'Đề thi Vật lý',
    description: 'Đề tổng hợp cơ bản',
    durationMinutes: 75,
    passingScore: 5,
    maxAttempts: 2,
    premium: true,
    teaserQuestionCount: 5,
    tags: [{ id: 301, name: 'Vật lý' }],
    totalQuestions: 45,
    status: 'PUBLISHED',
    createdAt: '2026-04-17T10:00:00Z',
    modifiedAt: '2026-04-17T10:00:00Z',
  },
];

const mockRatings: ExamRatingSummary[] = [
  { examId: 1, averageRating: 4.5, ratingCount: 10, userRating: null },
  { examId: 2, averageRating: 4.2, ratingCount: 8, userRating: null },
  { examId: 3, averageRating: 4.0, ratingCount: 6, userRating: null },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <PublicExams />
    </MemoryRouter>,
  );

describe('PublicExams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchPublicExams).mockResolvedValue(mockExams);
    vi.mocked(fetchExamRatingSummaries).mockResolvedValue(mockRatings);
  });

  it('shows all exams by default', async () => {
    renderPage();

    expect(await screen.findByText('Đề thi Công nghệ & Tin học')).toBeInTheDocument();
    expect(screen.getByText('Đề thi Toán 12')).toBeInTheDocument();
    expect(screen.getByText('Đề thi Vật lý')).toBeInTheDocument();
    expect(screen.getByText('3 đề thi')).toBeInTheDocument();
  });

  it('filters exams by keyword after submitting search form', async () => {
    renderPage();

    expect(await screen.findByText('Đề thi Công nghệ & Tin học')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Tìm theo từ khóa/i), {
      target: { value: 'công nghệ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    await waitFor(() => {
      expect(screen.getByText('Đề thi Công nghệ & Tin học')).toBeInTheDocument();
      expect(screen.queryByText('Đề thi Toán 12')).not.toBeInTheDocument();
      expect(screen.queryByText('Đề thi Vật lý')).not.toBeInTheDocument();
      expect(screen.getByText('1 đề thi')).toBeInTheDocument();
    });
  });

  it('filters exams by clicking popular tag chip', async () => {
    renderPage();

    expect(await screen.findByText('Đề thi Công nghệ & Tin học')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /#IT \(1\)/i }));

    await waitFor(() => {
      expect(screen.getByText('Đề thi Công nghệ & Tin học')).toBeInTheDocument();
      expect(screen.queryByText('Đề thi Toán 12')).not.toBeInTheDocument();
      expect(screen.queryByText('Đề thi Vật lý')).not.toBeInTheDocument();
      expect(screen.getByText('1 đề thi')).toBeInTheDocument();
    });
  });
});
