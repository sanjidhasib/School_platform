export const ROLES = { ADMIN: 'ADMIN', TEACHER: 'TEACHER', STUDENT: 'STUDENT', GUARDIAN: 'GUARDIAN' } as const;
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const PERIODS = [
  { label: '1st Period', start: '09:00', end: '10:00' },
  { label: '2nd Period', start: '10:00', end: '11:00' },
  { label: '3rd Period', start: '11:00', end: '12:00' },
  { label: '4th Period', start: '12:00', end: '13:00' },
  { label: '5th Period', start: '13:00', end: '14:00' },
];
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
