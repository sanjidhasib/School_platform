import { RoleGuard } from '@/components/layout/RoleGuard';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="TEACHER">{children}</RoleGuard>;
}
