import api from './client';
export const teacherAPI = {
  getTodaySchedule: () => api.get('/teacher/schedule/today'),
  createAttendanceSession: (data: any) => api.post('/teacher/attendance/session', data),
  getAttendanceSession: (sessionId: string) => api.get(`/teacher/attendance/${sessionId}`),
  saveAttendance: (sessionId: string, data: any) => api.put(`/teacher/attendance/${sessionId}`, data),
  getAttendanceHistory: () => api.get('/teacher/attendance/history'),
  createHomework: (data: any) => api.post('/teacher/homework', data),
  getHomework: () => api.get('/teacher/homework'),
  getHomeworkSubmissions: (id: string) => api.get(`/teacher/homework/${id}/submissions`),
  gradeSubmission: (id: string, data: any) => api.patch(`/teacher/homework/submissions/${id}`, data),
  createAssessment: (data: any) => api.post('/teacher/results/assessments', data),
  getAssessments: () => api.get('/teacher/results/assessments'),
  saveMarks: (assessmentId: string, marks: any[]) => api.put(`/teacher/results/assessments/${assessmentId}/marks`, { marks }),
  saveGrades: (grades: any[]) => api.put('/teacher/results/grades', { grades }),
};
