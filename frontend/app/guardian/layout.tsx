import { RoleGuard } from '@/components/layout/RoleGuard';

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="GUARDIAN">{children}</RoleGuard>;
}
