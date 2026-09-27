import api from './client';
export const aiAPI = {
  getContext: () => api.get('/ai/context'),
  createSession: (data: { subjectId: string; preferredLanguage?: 'EN' | 'BN' }) => api.post('/ai/sessions', data),
  getSessions: () => api.get('/ai/sessions'),
  getSession: (id: string) => api.get(`/ai/sessions/${id}`),
  updateSession: (id: string, data: { preferredLanguage: 'EN' | 'BN' }) => api.patch(`/ai/sessions/${id}`, data),
  deleteSession: (id: string) => api.delete(`/ai/sessions/${id}`),
  sendMessage: (sessionId: string, content: string) => api.post(`/ai/sessions/${sessionId}/messages`, { content }),
};
