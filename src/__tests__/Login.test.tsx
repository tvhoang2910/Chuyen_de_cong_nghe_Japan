import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Hoisted mocks (must be declared before any imports that trigger side-effects)
// ---------------------------------------------------------------------------

const {
  mockPost,
  mockFetchCurrentUserProfile,
  mockPersistAuthSession,
  mockNavigate,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockFetchCurrentUserProfile: vi.fn(),
  mockPersistAuthSession: vi.fn(),
  mockNavigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  default: { post: mockPost },
  fetchCurrentUserProfile: mockFetchCurrentUserProfile,
  persistAuthSession: mockPersistAuthSession,
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

// framer-motion: avoid animation timing issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
  },
}));

import Login from '../pages/Login';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email, password fields and submit button', () => {
    renderLogin();

    expect(screen.getByLabelText(/địa chỉ email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xác nhận đăng nhập/i })).toBeInTheDocument();
  });

  it('shows validation error toast when email is empty on submit', async () => {
    renderLogin();

    // Only fill password
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Vui lòng nhập đầy đủ email và mật khẩu.');
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('shows validation error toast when password is empty on submit', async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText(/địa chỉ email/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Vui lòng nhập đầy đủ email và mật khẩu.');
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('calls login API with correct credentials on submit', async () => {
    mockPost.mockResolvedValue({
      data: { accessToken: 'tok', refreshToken: 'ref', email: 'user@example.com', role: 'USER' },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/địa chỉ email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/login', {
        email: 'user@example.com',
        password: 'secret123',
      });
    });
  });

  it('redirects to /dashboard after successful login as USER', async () => {
    mockPost.mockResolvedValue({
      data: { accessToken: 'tok', refreshToken: 'ref', email: 'user@example.com', role: 'USER' },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/địa chỉ email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Đăng nhập thành công!');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects to /admin/users after successful login as ADMIN', async () => {
    mockPost.mockResolvedValue({
      data: { accessToken: 'tok', refreshToken: 'ref', email: 'admin@example.com', role: 'ADMIN' },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/địa chỉ email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), { target: { value: 'adminpass' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  it('shows error toast on wrong credentials (401)', async () => {
    const error = {
      response: { status: 401, data: { message: 'Invalid credentials' } },
      isAxiosError: true,
    };
    mockPost.mockRejectedValue(error);

    renderLogin();

    fireEvent.change(screen.getByLabelText(/địa chỉ email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows fallback error toast when API returns no message', async () => {
    mockPost.mockRejectedValue({ response: { status: 500, data: {} }, isAxiosError: true });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/địa chỉ email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    });
  });

  it('shows link to register page', () => {
    renderLogin();
    const link = screen.getByRole('link', { name: /đăng ký ngay/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });

  it('shows link to forgot password page', () => {
    renderLogin();
    const link = screen.getByRole('link', { name: /quên mật khẩu/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  it('redirects to verify-email page when email is not verified', async () => {
    const error = {
      response: { status: 403, data: { message: 'Email is not verified' } },
      isAxiosError: true,
    };
    mockPost.mockRejectedValue(error);

    renderLogin();

    fireEvent.change(screen.getByLabelText(/địa chỉ email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/register/verify-email'),
      );
    });
  });
});
