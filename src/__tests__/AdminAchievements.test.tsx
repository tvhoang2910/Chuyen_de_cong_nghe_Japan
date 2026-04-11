import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import AdminAchievements from '../pages/AdminAchievements';

const {
  fetchAdminGamificationAchievements,
  createAdminGamificationAchievement,
  updateAdminGamificationAchievement,
  deleteAdminGamificationAchievement,
  assignAdminGamificationAchievementToUser,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  fetchAdminGamificationAchievements: vi.fn(),
  createAdminGamificationAchievement: vi.fn(),
  updateAdminGamificationAchievement: vi.fn(),
  deleteAdminGamificationAchievement: vi.fn(),
  assignAdminGamificationAchievementToUser: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../api/studyClient', () => ({
  fetchAdminGamificationAchievements,
  createAdminGamificationAchievement,
  updateAdminGamificationAchievement,
  deleteAdminGamificationAchievement,
  assignAdminGamificationAchievementToUser,
}));

vi.mock('../components/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: toastSuccess,
    error: toastError,
  },
}));

type AchievementDefinition = {
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

const buildDefinition = (overrides: Partial<AchievementDefinition> = {}): AchievementDefinition => ({
  code: 'STREAK_DAYS_5',
  name: 'Giữ nhịp học',
  description: 'Duy trì streak 5 ngày liên tiếp.',
  icon: 'FLAME',
  groupName: 'Chuỗi',
  points: 160,
  active: true,
  autoUnlockRule: null,
  ruleType: 'STREAK_DAYS',
  ruleThreshold: 5,
  ruleThresholdSecondary: null,
  ruleConfigJson: null,
  ...overrides,
});

describe('AdminAchievements page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminGamificationAchievements.mockResolvedValue([]);
  });

  it('loads and renders admin achievements from API', async () => {
    fetchAdminGamificationAchievements.mockResolvedValue([buildDefinition()]);

    render(<AdminAchievements />);

    await waitFor(() => {
      expect(fetchAdminGamificationAchievements).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Giữ nhịp học')).toBeInTheDocument();
    expect(screen.getByText('Điều kiện mở khóa:')).toBeInTheDocument();
    expect(screen.getByText('Duy trì streak 5 ngày')).toBeInTheDocument();
  });

  it('shows validation error and blocks save when required fields are missing', async () => {
    render(<AdminAchievements />);

    await waitFor(() => {
      expect(fetchAdminGamificationAchievements).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thành tựu' }));

    expect(toastError).toHaveBeenCalledWith('Vui lòng nhập đủ tên và mô tả.');
    expect(createAdminGamificationAchievement).not.toHaveBeenCalled();
    expect(updateAdminGamificationAchievement).not.toHaveBeenCalled();
  });

  it('creates a new cumulative achievement with normalized payload', async () => {
    createAdminGamificationAchievement.mockResolvedValue(
      buildDefinition({
        code: 'CUMULATIVE_EXAM_ATTEMPTS_5_123456',
        name: 'Bền bỉ luyện tập',
        description: 'Hoàn thành 5 bài thi.',
        ruleType: 'CUMULATIVE_EXAM_ATTEMPTS',
        ruleThreshold: 5,
      }),
    );

    render(<AdminAchievements />);

    await waitFor(() => {
      expect(fetchAdminGamificationAchievements).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText('Tên thành tựu'), {
      target: { value: 'Bền bỉ luyện tập' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mô tả'), {
      target: { value: 'Hoàn thành 5 bài thi.' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ngưỡng chính'), {
      target: { value: '5' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thành tựu' }));

    await waitFor(() => {
      expect(createAdminGamificationAchievement).toHaveBeenCalledTimes(1);
    });

    const payload = createAdminGamificationAchievement.mock.calls[0][0] as {
      code: string;
      ruleType: string | null;
      ruleThreshold: number | null;
      ruleThresholdSecondary: number | null;
    };

    expect(payload.code).toMatch(/^CUMULATIVE_EXAM_ATTEMPTS_5_\d{6}$/);
    expect(payload.ruleType).toBe('CUMULATIVE_EXAM_ATTEMPTS');
    expect(payload.ruleThreshold).toBe(5);
    expect(payload.ruleThresholdSecondary).toBeNull();
    expect(toastSuccess).toHaveBeenCalledWith('Đã tạo thành tựu mới.');
  });

  it('updates selected achievement and keeps path code stable', async () => {
    fetchAdminGamificationAchievements.mockResolvedValue([buildDefinition()]);
    updateAdminGamificationAchievement.mockResolvedValue(
      buildDefinition({ description: 'Streak 5 ngày, phiên bản cập nhật.' }),
    );

    render(<AdminAchievements />);

    await waitFor(() => {
      expect(screen.getByText('Giữ nhịp học')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Giữ nhịp học'));
    fireEvent.change(screen.getByPlaceholderText('Mô tả'), {
      target: { value: 'Streak 5 ngày, phiên bản cập nhật.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thành tựu' }));

    await waitFor(() => {
      expect(updateAdminGamificationAchievement).toHaveBeenCalledTimes(1);
    });

    const [code, payload] = updateAdminGamificationAchievement.mock.calls[0] as [
      string,
      { description: string; ruleType: string | null; ruleThreshold: number | null },
    ];

    expect(code).toBe('STREAK_DAYS_5');
    expect(payload.description).toBe('Streak 5 ngày, phiên bản cập nhật.');
    expect(payload.ruleType).toBe('STREAK_DAYS');
    expect(payload.ruleThreshold).toBe(5);
    expect(toastSuccess).toHaveBeenCalledWith('Đã cập nhật thành tựu.');
  });

  it('assigns selected active achievement to user', async () => {
    fetchAdminGamificationAchievements.mockResolvedValue([buildDefinition()]);
    assignAdminGamificationAchievementToUser.mockResolvedValue(undefined);

    render(<AdminAchievements />);

    await waitFor(() => {
      expect(screen.getByText('Giữ nhịp học')).toBeInTheDocument();
    });

    const assignHeading = screen.getByRole('heading', { name: 'Gán thành tựu cho user' });
    const assignForm = assignHeading.closest('form');
    expect(assignForm).not.toBeNull();

    const scoped = within(assignForm as HTMLFormElement);
    fireEvent.change(scoped.getByRole('combobox'), { target: { value: 'STREAK_DAYS_5' } });
    fireEvent.change(scoped.getByPlaceholderText('User ID'), { target: { value: '99' } });
    fireEvent.submit(assignForm as HTMLFormElement);

    await waitFor(() => {
      expect(assignAdminGamificationAchievementToUser).toHaveBeenCalledWith('STREAK_DAYS_5', 99);
    });

    expect(toastSuccess).toHaveBeenCalledWith('Đã gán thành tựu STREAK_DAYS_5 cho user 99.');
  });

  it('deletes achievement and reloads list', async () => {
    fetchAdminGamificationAchievements
      .mockResolvedValueOnce([buildDefinition()])
      .mockResolvedValueOnce([]);
    deleteAdminGamificationAchievement.mockResolvedValue(undefined);

    render(<AdminAchievements />);

    await waitFor(() => {
      expect(screen.getByText('Giữ nhịp học')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Xóa thành tựu' }));

    await waitFor(() => {
      expect(deleteAdminGamificationAchievement).toHaveBeenCalledWith('STREAK_DAYS_5');
    });

    expect(toastSuccess).toHaveBeenCalledWith('Đã xóa thành tựu.');
    expect(fetchAdminGamificationAchievements).toHaveBeenCalledTimes(2);
  });
});
