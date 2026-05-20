import React, { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

const {
  initiateUpload,
  completeUpload,
  fetchPendingQueue,
  fetchUploadDetail,
  fetchAdminUploadHistory,
  approveUpload,
  subscribe,
  unsubscribe,
} = vi.hoisted(() => ({
  initiateUpload: vi.fn(),
  completeUpload: vi.fn(),
  fetchPendingQueue: vi.fn(),
  fetchUploadDetail: vi.fn(),
  fetchAdminUploadHistory: vi.fn(),
  approveUpload: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(() => {}), // <-- Sửa: trả về hàm rỗng thay vì vi.fn() thuần túy
}));

vi.mock('../api/examUploadClient', async () => {
  const actual = await vi.importActual<typeof import('../api/examUploadClient')>(
    '../api/examUploadClient',
  );
  return {
    ...actual,
    initiateUpload,
    completeUpload,
    fetchPendingQueue,
    fetchUploadDetail,
    fetchAdminUploadHistory,
    approveUpload,
    rejectUpload: vi.fn(),
    uploadPageToStorage: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../api/axiosClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/axiosClient')>();
  return {
    ...actual,
    getCurrentSessionRole: vi.fn(() => 'ADMIN'),
    fetchCurrentUserProfile: vi.fn().mockResolvedValue({
      id: 1,
      email: 'a@x.com',
      fullName: 'Admin',
      role: 'ADMIN',
      premium: false,
    }),
    fetchSubscriptionReviewQueue: vi.fn().mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
    }),
    SUBSCRIPTION_REVIEW_UPDATED_EVENT: 'subscription-review-updated',
    clearAuthSession: vi.fn(),
  };
});

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../hooks/useExamEventsSSE', () => ({
  useExamEventsSSE: () => ({
    activeAttempts: 0,
    submissionsToday: 0,
    lastEvent: null,
    subscribe,
  }),
}));

import { useExamUploadFlow } from '../hooks/useExamUploadFlow';
import AdminUploadQueue from '../pages/AdminUploadQueue';

const makeFile = (name: string, type: string): File =>
  new File([new Blob(['x'])], name, { type });

describe('useExamUploadFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initiates, uploads and completes happy path', async () => {
    initiateUpload.mockResolvedValue({
      uploadId: 42,
      pages: [{ index: 0, objectKey: 'k/0', url: 'https://minio.local/k/0', expiresInSeconds: 600 }],
    });
    completeUpload.mockResolvedValue({
      id: 42,
      status: 'PENDING_APPROVAL',
    });

    const TestHarness: React.FC = () => {
      const flow = useExamUploadFlow();
      return (
        <button type="button" onClick={() => void flow.upload({ title: 'My exam', files: [makeFile('page1.png', 'image/png')] })}>
          go
        </button>
      );
    };

    render(<TestHarness />);
    await act(async () => { fireEvent.click(screen.getByText('go')); });
    await waitFor(() => expect(completeUpload).toHaveBeenCalledWith(42, undefined));
  });

  it('rejects when more than 20 pages', async () => {
    const files = Array.from({ length: 21 }, (_, i) => makeFile(`p${i}.png`, 'image/png'));
    const TestHarness: React.FC = () => {
      const flow = useExamUploadFlow();
      return <button type="button" onClick={() => void flow.upload({ title: 'too many', files })}>go</button>;
    };
    render(<TestHarness />);
    await act(async () => { fireEvent.click(screen.getByText('go')); });
    await waitFor(() => expect(initiateUpload).not.toHaveBeenCalled());
  });
});

describe('AdminUploadQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Gán unsubscribe vào hàm subscribe
    subscribe.mockReturnValue(unsubscribe);

    fetchPendingQueue.mockResolvedValue({
      content: [{ id: 7, uploaderId: 9, uploaderRole: 'USER', title: 'Đề Vật Lý 12', pageCount: 3, status: 'PENDING_APPROVAL', createdAt: '2026-04-17T00:00:00Z' }],
      page: 0, totalElements: 1, totalPages: 1,
    });
    fetchUploadDetail.mockResolvedValue({
      id: 7, title: 'Đề Vật Lý 12', status: 'PENDING_APPROVAL', viewUrls: ['https://minio.local/p/0.png'],
    });
  });

  it('renders queue and approves row', async () => {
    render(<MemoryRouter><AdminUploadQueue /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Đề Vật Lý 12')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('upload-row-7'));
    await waitFor(() => expect(screen.getByTestId('approve-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('approve-btn'));
    await waitFor(() => expect(approveUpload).toHaveBeenCalledWith(7));
  });
});