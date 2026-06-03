import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../components/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));
import ContributorDashboard from '../pages/ContributorDashboard';

describe('ContributorDashboard', () => {
  it('renders separate action for reviewing user uploads', () => {
    render(
      <MemoryRouter>
        <ContributorDashboard />
      </MemoryRouter>,
    );

    const reviewLink = screen.getByRole('link', { name: /Duyệt upload người dùng/i });
    expect(reviewLink).toHaveAttribute('href', '/contributor/upload-queue');
    expect(screen.getByText('Đề tôi đã upload')).toBeInTheDocument();
  });
});
