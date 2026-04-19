import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const {
  fetchMyUploads,
  fetchUploadHistory,
  subscribe,
  unsubscribe,
} = vi.hoisted(() => ({
  fetchMyUploads: vi.fn(),
  fetchUploadHistory: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('../api/examUploadClient', async () => {
  const actual = await vi.importActual<typeof import('../api/examUploadClient')>('../api/examUploadClient');
  return {
    ...actual,
    fetchMyUploads,
    fetchUploadHistory,
  };
});

vi.mock('../hooks/useExamEventsSSE', () => ({
  useExamEventsSSE: () => ({
    activeAttempts: 0,
    submissionsToday: 0,
    lastEvent: null,
    subscribe,
  }),
}));

vi.mock('../components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import MyExamUploads from '../pages/MyExamUploads';

describe('MyExamUploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    localStorage.clear();
    localStorage.setItem('access_token', 'token');
    fetchUploadHistory.mockResolvedValue([]);
    subscribe.mockImplementation(() => unsubscribe);
  });

  it('renders CTA link when upload is EXTRACTED and extractedExamId exists', async () => {
    fetchMyUploads.mockResolvedValue({
      content: [
        {
          id: 1,
          uploaderId: 10,
          uploaderRole: 'USER',
          title: 'Exam extracted',
          pageCount: 3,
          status: 'EXTRACTED',
          extractedExamId: 42,
          createdAt: '2026-04-17T00:00:00Z',
          modifiedAt: '2026-04-17T00:00:00Z',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <MyExamUploads />
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: 'Mở đề đã trích xuất' });
    expect(link).toHaveAttribute('href', '/dashboard/exams/42');
  });

  it('renders extractionError when status is EXTRACT_FAILED', async () => {
    fetchMyUploads.mockResolvedValue({
      content: [
        {
          id: 2,
          uploaderId: 10,
          uploaderRole: 'USER',
          title: 'Exam failed',
          pageCount: 3,
          status: 'EXTRACT_FAILED',
          extractionError: 'OCR fail',
          createdAt: '2026-04-17T00:00:00Z',
          modifiedAt: '2026-04-17T00:00:00Z',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <MyExamUploads />
      </MemoryRouter>,
    );

    expect(await screen.findByText('OCR fail')).toBeInTheDocument();
  });

  it('falls back to rejectionReason when extractionError is missing', async () => {
    fetchMyUploads.mockResolvedValue({
      content: [
        {
          id: 3,
          uploaderId: 10,
          uploaderRole: 'USER',
          title: 'Exam failed fallback',
          pageCount: 3,
          status: 'EXTRACT_FAILED',
          rejectionReason: 'Rejected by reviewer',
          createdAt: '2026-04-17T00:00:00Z',
          modifiedAt: '2026-04-17T00:00:00Z',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <MyExamUploads />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Rejected by reviewer')).toBeInTheDocument();
  });

  it('polls every 8 seconds when any upload is EXTRACTING', async () => {
    vi.useFakeTimers();
    fetchMyUploads.mockResolvedValue({
      content: [
        {
          id: 4,
          uploaderId: 10,
          uploaderRole: 'USER',
          title: 'Extracting exam',
          pageCount: 3,
          status: 'EXTRACTING',
          createdAt: '2026-04-17T00:00:00Z',
          modifiedAt: '2026-04-17T00:00:00Z',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <MyExamUploads />
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMyUploads).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(8000);
      await Promise.resolve();
    });
    expect(fetchMyUploads).toHaveBeenCalledTimes(2);
  });

  it('does not poll when all uploads are in terminal states', async () => {
    vi.useFakeTimers();
    fetchMyUploads.mockResolvedValue({
      content: [
        {
          id: 5,
          uploaderId: 10,
          uploaderRole: 'USER',
          title: 'Extracted exam',
          pageCount: 3,
          status: 'EXTRACTED',
          extractedExamId: 88,
          createdAt: '2026-04-17T00:00:00Z',
          modifiedAt: '2026-04-17T00:00:00Z',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <MyExamUploads />
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMyUploads).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(16000);
      await Promise.resolve();
    });

    expect(fetchMyUploads).toHaveBeenCalledTimes(1);
  });
});
