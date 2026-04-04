import axiosClient from './axiosClient';

export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export interface AuditLogEntry {
  id: number;
  action: string;
  outcome: AuditOutcome;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string; // ISO timestamp
}

export interface AuditLogPage {
  content: AuditLogEntry[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AuditLogStats {
  failedLoginsToday: number;
  successfulLoginsToday: number;
  failedLoginsTodayChange: number;
}

export interface AuditLogFilters {
  email?: string;
  action?: string;
  outcome?: string;
  fromDate?: string;
  toDate?: string;
}

function normalizeDateParam(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
  if (localDateTimePattern.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return trimmed;
}

export async function fetchAuditLogs(filters: AuditLogFilters, page = 0, size = 20): Promise<AuditLogPage> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (filters.email) params.set('email', filters.email);
  if (filters.action) params.set('action', filters.action);
  if (filters.outcome) params.set('outcome', filters.outcome);
  if (filters.fromDate) params.set('fromDate', normalizeDateParam(filters.fromDate));
  if (filters.toDate) params.set('toDate', normalizeDateParam(filters.toDate));

  const response = await axiosClient.get<AuditLogPage>(`/admin/audit-logs?${params.toString()}`);
  return response.data;
}

export async function fetchAuditLogStats(): Promise<AuditLogStats> {
  const response = await axiosClient.get<AuditLogStats>('/admin/audit-logs/stats');
  return response.data;
}

export async function fetchAuditActionTypes(): Promise<Record<string, string>> {
  const response = await axiosClient.get<Record<string, string>>('/admin/audit-logs/actions');
  return response.data;
}
