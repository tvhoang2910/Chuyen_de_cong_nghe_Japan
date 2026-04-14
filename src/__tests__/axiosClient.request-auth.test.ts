import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

const getItemMock = vi.fn();

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: getItemMock,
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

const { mockClient, mockRefreshClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  },
  mockRefreshClient: {
    post: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  },
}));

vi.mock('axios', () => ({
  default: {
    create: vi
      .fn()
      .mockImplementationOnce(() => mockClient)
      .mockImplementationOnce(() => mockRefreshClient),
  },
}));

import '../api/axiosClient';

describe('axiosClient request auth header behavior', () => {
  beforeEach(() => {
    getItemMock.mockImplementation((key: string) => {
      if (key === 'access_token') {
        return 'expired-access-token';
      }
      return null;
    });
  });

  it('does not attach Authorization header for /refresh', () => {
    const requestInterceptor = mockClient.interceptors.request.use.mock.calls[0][0] as (
      config: InternalAxiosRequestConfig,
    ) => InternalAxiosRequestConfig;

    const config = {
      url: '/refresh',
      headers: {},
    } as InternalAxiosRequestConfig;

    const nextConfig = requestInterceptor(config);

    expect(nextConfig.headers.Authorization).toBeUndefined();
  });

  it('attaches Authorization header for protected endpoints', () => {
    const requestInterceptor = mockClient.interceptors.request.use.mock.calls[0][0] as (
      config: InternalAxiosRequestConfig,
    ) => InternalAxiosRequestConfig;

    const config = {
      url: '/me',
      headers: {},
    } as InternalAxiosRequestConfig;

    const nextConfig = requestInterceptor(config);

    expect(nextConfig.headers.Authorization).toBe('Bearer expired-access-token');
  });
});