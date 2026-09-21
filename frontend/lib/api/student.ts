import api from './client';
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getAttendance: (params?: any) => api.get('/student/attendance', { params }),
  getHomework: () => api.get('/student/homework'),
  submitHomework: (id: string, data: any) => api.post(`/student/homework/${id}/submit`, data),
  getResults: () => api.get('/student/results'),
  getNotifications: (params?: any) => api.get('/student/notifications', { params }),
  markNotificationRead: (id: string) => api.patch(`/student/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/student/notifications/read-all', {}),
  downloadReport: () => api.get('/student/report', { responseType: 'blob' }),
};
