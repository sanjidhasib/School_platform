import api from './client';
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getSubjects: () => api.get('/student/subjects'),
  getAttendance: (params?: any) => api.get('/student/attendance', { params }),
  getHomework: () => api.get('/student/homework'),
  submitHomework: (id: string, data: any) => api.post(`/student/homework/${id}/submit`, data),
  getResults: () => api.get('/student/results'),
  getTimetable: () => api.get('/student/timetable'),
  // Personal diary
  getDiary: (date: string) => api.get('/student/diary', { params: { date } }),
  addDiaryEntry: (data: { date: string; kind: 'HOMEWORK' | 'STUDY'; subjectId?: string; text: string }) => api.post('/student/diary', data),
  updateDiaryEntry: (id: string, data: { done?: boolean; text?: string }) => api.patch(`/student/diary/${id}`, data),
  deleteDiaryEntry: (id: string) => api.delete(`/student/diary/${id}`),
  // Class tests
  getTests: () => api.get('/student/tests'),
  startTest: (id: string) => api.post(`/student/tests/${id}/start`),
  saveTestAnswers: (id: string, answers: any[]) => api.put(`/student/tests/${id}/answers`, { answers }),
  submitTest: (id: string, answers: any[]) => api.post(`/student/tests/${id}/submit`, { answers }),
  getTestResult: (id: string) => api.get(`/student/tests/${id}/result`),
  getNotifications: (params?: any) => api.get('/student/notifications', { params }),
  markNotificationRead: (id: string) => api.patch(`/student/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/student/notifications/read-all', {}),
  downloadReport: () => api.get('/student/report', { responseType: 'blob' }),
  // Class library
  getTextbooks: () => api.get('/student/textbooks'),
  getTextbook: (id: string) => api.get(`/student/textbooks/${id}`),
  textbookFileUrl: (id: string) => `${api.defaults.baseURL}/student/textbooks/${id}/file`,
};
