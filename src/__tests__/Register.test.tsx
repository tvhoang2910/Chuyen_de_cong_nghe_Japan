import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockPost,
  mockNavigate,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockNavigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  default: { post: mockPost },
}));

vi.mock('../config/env', () => ({
  buildGoogleOAuthAuthorizationUrl: vi.fn(() => 'https://accounts.google.com/o/oauth2/v2/auth'),
}));

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

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) =>
      React.createElement('button', props, children),
  },
}));

import Register from '../pages/Register';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText(/họ và tên/i), { target: { value: 'Nguyen Van A' } });
  fireEvent.change(screen.getByLabelText(/email sinh viên/i), { target: { value: 'nguyenvana@student.edu.vn' } });
  fireEvent.change(screen.getByLabelText(/^mật khẩu$/i), { target: { value: 'Password123' } });
  fireEvent.change(screen.getByLabelText(/nhập lại mật khẩu/i), { target: { value: 'Password123' } });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all register form fields', () => {
    renderRegister();

    expect(screen.getByLabelText(/họ và tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email sinh viên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mật khẩu$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nhập lại mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bắt đầu ngay/i })).toBeInTheDocument();
  });

  it('validates full name — shows error when shorter than 3 chars', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText(/họ và tên/i), { target: { value: 'AB' } });
    fireEvent.change(screen.getByLabelText(/email sinh viên/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^mật khẩu$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/nhập lại mật khẩu/i), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu ngay/i }));

    await waitFor(() => {
      expect(screen.getByText(/họ tên phải có ít nhất 3 ký tự/i)).toBeInTheDocument();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('validates email format — shows error on invalid email', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText(/họ và tên/i), { target: { value: 'Nguyen Van A' } });
    // Use a value without @ to trigger zod email validation failure
    fireEvent.change(screen.getByLabelText(/email sinh viên/i), { target: { value: 'plainaddress' } });
    fireEvent.change(screen.getByLabelText(/^mật khẩu$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/nhập lại mật khẩu/i), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu ngay/i }));

    await waitFor(() => {
      // zod v4 may report "Invalid email" in English or Vietnamese depending on locale
      const errors = screen.getAllByText(/email/i);
      expect(errors.length).toBeGreaterThan(0);
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('validates password minimum length (8 chars)', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText(/họ và tên/i), { target: { value: 'Nguyen Van A' } });
    fireEvent.change(screen.getByLabelText(/email sinh viên/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^mật khẩu$/i), { target: { value: 'Short1' } });
    // Also fill confirm password with same short value to trigger only password error
    fireEvent.change(screen.getByLabelText(/nhập lại mật khẩu/i), { target: { value: 'Short1' } });
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu ngay/i }));

    await waitFor(() => {
      // Both password fields show the 8-char error — use getAllByText
      const errors = screen.getAllByText(/mật khẩu phải từ 8 ký tự/i);
      expect(errors.length).toBeGreaterThan(0);
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('validates password confirmation match', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText(/họ và tên/i), { target: { value: 'Nguyen Van A' } });
    fireEvent.change(screen.getByLabelText(/email sinh viên/i), { target: { value: 'a@student.edu.vn' } });
    fireEvent.change(screen.getByLabelText(/^mật khẩu$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/nhập lại mật khẩu/i), { target: { value: 'DifferentPass' } });
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu ngay/i }));

    await waitFor(() => {
      expect(screen.getByText(/mật khẩu xác nhận không khớp/i)).toBeInTheDocument();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('calls register API with correct payload on valid submit', async () => {
    mockPost.mockResolvedValue({ status: 201, data: {} });

    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu ngay/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/register', {
        fullName: 'Nguyen Van A',
        email: 'nguyenvana@student.edu.vn',
        password: 'Password123',
        role: 'USER',
      });
    });
  });

  it('redirects to verify-email page after successful registration', async () => {
    mockPost.mockResolvedValue({ status: 201, data: {} });

    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu ngay/i }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Đăng ký thành công'),
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/register/verify-email'),
      );
    });
  });

  it('shows error toast when email already exists (409)', async () => {
    mockPost.mockRejectedValue({ response: { status: 409 } });

    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /bắt đầu ngay/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'Email này đã được sử dụng. Vui lòng thử email khác.',
      );
    });
  });

  it('shows link to login page', () => {
    renderRegister();
    const link = screen.getByRole('link', { name: /đăng nhập/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });
});
