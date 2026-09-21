import api from './client';
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.patch('/admin/settings', data),
  // Teachers
  getTeachers: (params?: any) => api.get('/admin/teachers', { params }),
  getTeacher: (id: string) => api.get(`/admin/teachers/${id}`),
  createTeacher: (data: any) => api.post('/admin/teachers', data),
  updateTeacher: (id: string, data: any) => api.patch(`/admin/teachers/${id}`, data),
  deleteTeacher: (id: string) => api.delete(`/admin/teachers/${id}`),
  // Students
  getStudents: (params?: any) => api.get('/admin/students', { params }),
  getStudent: (id: string) => api.get(`/admin/students/${id}`),
  createStudent: (data: any) => api.post('/admin/students', data),
  updateStudent: (id: string, data: any) => api.patch(`/admin/students/${id}`, data),
  deleteStudent: (id: string) => api.delete(`/admin/students/${id}`),
  // Classes
  getClasses: (params?: any) => api.get('/admin/classes', { params }),
  createClass: (data: any) => api.post('/admin/classes', data),
  updateClass: (id: string, data: any) => api.patch(`/admin/classes/${id}`, data),
  getClassStudents: (classId: string) => api.get(`/admin/classes/${classId}/students`),
  // Subjects
  getSubjects: (params?: any) => api.get('/admin/subjects', { params }),
  createSubject: (data: any) => api.post('/admin/subjects', data),
  updateSubject: (id: string, data: any) => api.patch(`/admin/subjects/${id}`, data),
  deleteSubject: (id: string) => api.delete(`/admin/subjects/${id}`),
  // Assignments
  getAssignments: (params?: any) => api.get('/admin/assignments', { params }),
  createAssignment: (data: any) => api.post('/admin/assignments', data),
  updateAssignment: (id: string, data: any) => api.patch(`/admin/assignments/${id}`, data),
  deleteAssignment: (id: string) => api.delete(`/admin/assignments/${id}`),
  // Timetable
  getTimetable: (params?: any) => api.get('/admin/timetable', { params }),
  createTimetableEntry: (data: any) => api.post('/admin/timetable', data),
  updateTimetableEntry: (id: string, data: any) => api.patch(`/admin/timetable/${id}`, data),
  deleteTimetableEntry: (id: string) => api.delete(`/admin/timetable/${id}`),
  // Notices
  getNotices: () => api.get('/admin/notices'),
  createNotice: (data: any) => api.post('/admin/notices', data),
  updateNotice: (id: string, data: any) => api.patch(`/admin/notices/${id}`, data),
  deleteNotice: (id: string) => api.delete(`/admin/notices/${id}`),
  // Achievements
  getAchievements: () => api.get('/admin/achievements'),
  createAchievement: (data: any) => api.post('/admin/achievements', data),
  updateAchievement: (id: string, data: any) => api.patch(`/admin/achievements/${id}`, data),
  deleteAchievement: (id: string) => api.delete(`/admin/achievements/${id}`),
  // School-wide read-only views (added with the redesign; admin previously had
  // no cross-school view because the teacher controllers are teacher-scoped).
  getAttendanceOverview: (params?: any) => api.get('/admin/attendance', { params }),
  getHomeworkOverview: (params?: any) => api.get('/admin/homework', { params }),
  getResultsOverview: (params?: any) => api.get('/admin/results', { params }),
  getNotifications: (params?: any) => api.get('/admin/notifications', { params }),
};
