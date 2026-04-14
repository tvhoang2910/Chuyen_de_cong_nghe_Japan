import axios from 'axios';

import { analyticsApiBaseUrl } from '../config/env';

const analyticsClient = axios.create({
  baseURL: analyticsApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

analyticsClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * POST /analytics/admin/questions/recalculate-difficulty
 * ADMIN role required.
 * Triggers a re-calculation of question difficulties based on
 * historical attempt data (correct-answer rate, response time, etc.).
 */
export async function triggerDifficultyRecalculation(): Promise<{ updated: number }> {
  const response = await analyticsClient.post<{ updated: number }>('/admin/questions/recalculate-difficulty');
  return response.data;
}
