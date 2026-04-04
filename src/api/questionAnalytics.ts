import axios from 'axios';

const analyticsBaseUrl = import.meta.env.VITE_ANALYTICS_API_BASE_URL || 'http://localhost:8082/api/v1/analytics';

const analyticsClient = axios.create({
  baseURL: analyticsBaseUrl,
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
