import api from './client';
export const aiAPI = {
  createSession: (data: { subjectId: string; preferredLanguage?: 'EN' | 'BN' }) => api.post('/ai/sessions', data),
  getSessions: () => api.get('/ai/sessions'),
  getSession: (id: string) => api.get(`/ai/sessions/${id}`),
  sendMessage: (sessionId: string, content: string) => api.post(`/ai/sessions/${sessionId}/messages`, { content }),
};
