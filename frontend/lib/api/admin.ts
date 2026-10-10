import api, { DIRECT_API_URL } from './client';
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.patch('/admin/settings', data),
  // Website pictures: target is 'logo' or 'slide-0' … 'slide-4'
  uploadSchoolPicture: (target: string, file: File) => {
    const form = new FormData();
    form.append('target', target);
    form.append('file', file);
    return api.post('/admin/settings/media', form);
  },
  resetSchoolPicture: (target: string) => api.delete(`/admin/settings/media/${target}`),
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
  getCurriculum: (grade: number) => api.get('/admin/subjects/curriculum', { params: { grade } }),
  applyCurriculum: (grade: number, codes: string[]) => api.post('/admin/subjects/curriculum', { grade, codes }),
  removeSubjectFromGrade: (id: string, grade: number) => api.delete(`/admin/subjects/${id}/grades/${grade}`),
  // Class page: subjects, teachers and requests
  getClassOverview: (id: string) => api.get(`/admin/classes/${id}/overview`),
  assignClassTeacher: (id: string, data: { subjectId: string; teacherId: string | null }) => api.put(`/admin/classes/${id}/assign`, data),
  requestFromTeachers: (id: string, data: any) => api.post(`/admin/classes/${id}/requests`, data),
  cancelTeacherRequest: (requestId: string) => api.patch(`/admin/classes/requests/${requestId}/cancel`),
  // Assignments
  getAssignments: (params?: any) => api.get('/admin/assignments', { params }),
  createAssignment: (data: any) => api.post('/admin/assignments', data),
  updateAssignment: (id: string, data: any) => api.patch(`/admin/assignments/${id}`, data),
  deleteAssignment: (id: string) => api.delete(`/admin/assignments/${id}`),
  // Timetable
  getTimetable: (params?: any) => api.get('/admin/timetable', { params }),
  getTimetableClashes: () => api.get('/admin/timetable/clashes'),
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
  // Textbooks (NCTB PDFs for the library and AI)
  getTextbooks: (params?: any) => api.get('/admin/textbooks', { params }),
  uploadTextbook: async (form: FormData, onProgress?: (percent: number) => void) => {
    // Large books take a while; the default timeout (none) is kept on purpose.
    const onUploadProgress = (e: { loaded: number; total?: number }) =>
      onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0);
    if (!DIRECT_API_URL) return api.post('/admin/textbooks', form, { onUploadProgress });
    // Hosted: send the PDF straight to the backend, past the size-capped forwarder.
    const { data } = await api.post('/auth/upload-token');
    return api.post(`${DIRECT_API_URL.replace(/\/$/, '')}/admin/textbooks`, form, {
      onUploadProgress,
      withCredentials: false,
      headers: { Authorization: `Bearer ${data.data.token}` },
    });
  },
  updateTextbook: (id: string, data: { title?: string; edition?: string }) => api.patch(`/admin/textbooks/${id}`, data),
  reprocessTextbook: (id: string) => api.post(`/admin/textbooks/${id}/reprocess`),
  deleteTextbook: (id: string) => api.delete(`/admin/textbooks/${id}`),
  textbookFileUrl: (id: string) => `${api.defaults.baseURL}/admin/textbooks/${id}/file`,
};
