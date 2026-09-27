import api from './client';
export const publicAPI = {
  getAchievements: () => api.get('/public/achievements'),
  getUpcoming: () => api.get('/public/upcoming'),
  getNews: () => api.get('/public/news'),
  getAdmission: () => api.get('/public/admission'),
  getSchool: () => api.get('/public/school'),
};
