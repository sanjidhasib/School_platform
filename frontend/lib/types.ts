export interface User { _id: string; role: 'ADMIN'|'TEACHER'|'STUDENT'|'GUARDIAN'; email: string; username: string; phone?: string; isActive: boolean; }
export interface Teacher { _id: string; userId: User; teacherId: string; fullName: string; photoUrl?: string; degree: string; specialization?: string; phone: string; email: string; joiningDate: string; status: 'ACTIVE'|'INACTIVE'; }
export interface Student { _id: string; userId: User; studentId: string; fullName: string; photoUrl?: string; dateOfBirth?: string; gender?: string; classId: ClassRecord; guardianIds: Guardian[]; status: 'ACTIVE'|'INACTIVE'|'GRADUATED'|'TRANSFERRED'; }
export interface Guardian { _id: string; userId: User; fullName: string; relationship: string; phone: string; email?: string; isActive: boolean; }
export interface ClassRecord { _id: string; name: string; gradeNumber: number; section: string; capacity: number; room?: string; isActive: boolean; enrollmentCount?: number; }
export interface Subject { _id: string; code: string; name: string; nameBn?: string; classIds: string[]; isActive: boolean; }
export interface TeacherAssignment { _id: string; teacherId: Teacher; classId: ClassRecord; subjectId: Subject; academicSessionId: string; isActive: boolean; }
export interface Timetable { _id: string; classId: ClassRecord; teacherAssignmentId: TeacherAssignment; dayOfWeek: number; startTime: string; endTime: string; room?: string; isActive: boolean; }
export interface AttendanceSession { _id: string; classId: ClassRecord; subjectId: Subject; sessionDate: string; startTime: string; endTime: string; status: 'OPEN'|'SUBMITTED'|'LOCKED'; }
export interface AttendanceRecord { _id: string; studentId: Student; status: 'PRESENT'|'ABSENT'|'LEAVE'; note?: string; }
export interface Homework { _id: string; title: string; description: string; classId: ClassRecord; subjectId: Subject; dueAt: string; maxMarks: number; status: 'PUBLISHED'|'CLOSED'|'ARCHIVED'; submissionStatus?: 'NOT_SUBMITTED'|'SUBMITTED'|'LATE'|'GRADED'; }
export interface HomeworkSubmission { _id: string; homeworkId: string; studentId: Student; answerText?: string; submittedAt?: string; status: 'NOT_SUBMITTED'|'SUBMITTED'|'LATE'|'GRADED'; marks?: number; feedback?: string; }
export interface Assessment { _id: string; title: string; type: string; subjectId: Subject; classId: ClassRecord; maxMarks: number; assessmentDate: string; status: 'DRAFT'|'PUBLISHED'|'LOCKED'; }
export interface Mark { _id: string; assessmentId: Assessment; studentId: Student; obtainedMarks: number; absent: boolean; remarks?: string; }
export interface SubjectGrade { _id: string; studentId: Student; subjectId: Subject; term: string; percentage: number; grade: string; gradePoint: number; status: 'DRAFT'|'FINAL'; }
export interface Notification { _id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; relatedEntityType?: string; }
export interface Notice { _id: string; title: string; description: string; category: string; eventDate?: string; publishAt: string; isPublished: boolean; }
export interface Achievement { _id: string; title: string; description: string; category: string; imageUrl?: string; achievementDate: string; displayOrder: number; isPublished: boolean; }
export interface AiMessage { _id: string; role: 'USER'|'ASSISTANT'; content: string; sources?: {chapter: string; section?: string; pageNumber?: number; documentTitle: string}[]; createdAt: string; }
export interface AiSession { _id: string; subjectId: Subject; title?: string; startedAt: string; lastMessageAt?: string; status: 'ACTIVE'|'ENDED'; }

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any[];
}
