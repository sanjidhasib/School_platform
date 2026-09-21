import api from './client';
export const guardianAPI = {
  getDashboard: () => api.get('/guardian/dashboard'),
  getChildren: () => api.get('/guardian/children'),
  getChildAttendance: (id: string, params?: any) => api.get(`/guardian/children/${id}/attendance`, { params }),
  getChildHomework: (id: string) => api.get(`/guardian/children/${id}/homework`),
  getChildResults: (id: string) => api.get(`/guardian/children/${id}/results`),
  downloadChildReport: (id: string) => api.get(`/guardian/reports/${id}/report`, { responseType: 'blob' }),
  getNotifications: () => api.get('/student/notifications'),
};
