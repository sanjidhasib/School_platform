import api from './client';
export const publicAPI = {
  getAchievements: () => api.get('/public/achievements'),
  getUpcoming: () => api.get('/public/upcoming'),
  getSchool: () => api.get('/public/school'),
};
