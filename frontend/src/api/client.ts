import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 60000,
});

export const taskApi = {
  list: (params?: any) => api.get('/api/tasks', { params }),
  summary: () => api.get('/api/tasks/summary'),
  generate: () => api.post('/api/tasks/generate'),
};

export const planApi = {
  generateWeekly: () => api.post('/api/plans/weekly'),
  generateMonthly: () => api.post('/api/plans/monthly'),
  list: () => api.get('/api/plans'),
  get: (id: string | number) => api.get(`/api/plans/${id}`),
  getComparison: (id: string | number) => api.get(`/api/plans/${id}/comparison`),
  overrideBlock: (planId: string | number, blockId: string | number, data: any) =>
    api.patch(`/api/plans/${planId}/blocks/${blockId}`, data),
  approve: (planId: string | number, approvedBy: string) =>
    api.post(`/api/plans/${planId}/approve`, { approved_by: approvedBy }),
  exportCsv: (planId: string | number) =>
    api.get(`/api/plans/${planId}/export/csv`, { responseType: 'blob' }),
};

export const configApi = {
  getWeights: () => api.get('/api/config/weights'),
  updateWeights: (weights: any) => api.put('/api/config/weights', weights),
};

export const auditApi = {
  getOverrides: () => api.get('/api/audit/overrides'),
};
