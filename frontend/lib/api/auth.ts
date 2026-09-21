import api from './client';
export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  register: (data: any) => api.post('/auth/register', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.patch('/auth/change-password', data),
};
