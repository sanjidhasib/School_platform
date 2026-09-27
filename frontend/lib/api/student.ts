import api from './client';
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getSubjects: () => api.get('/student/subjects'),
  getAttendance: (params?: any) => api.get('/student/attendance', { params }),
  getHomework: () => api.get('/student/homework'),
  submitHomework: (id: string, data: any) => api.post(`/student/homework/${id}/submit`, data),
  getResults: () => api.get('/student/results'),
  getTimetable: () => api.get('/student/timetable'),
  getNotifications: (params?: any) => api.get('/student/notifications', { params }),
  markNotificationRead: (id: string) => api.patch(`/student/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/student/notifications/read-all', {}),
  downloadReport: () => api.get('/student/report', { responseType: 'blob' }),
  // Class library
  getTextbooks: () => api.get('/student/textbooks'),
  getTextbook: (id: string) => api.get(`/student/textbooks/${id}`),
  textbookFileUrl: (id: string) => `${api.defaults.baseURL}/student/textbooks/${id}/file`,
};
