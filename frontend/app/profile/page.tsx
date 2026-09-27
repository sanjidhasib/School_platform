'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/lib/api/auth';
import api from '@/lib/api/client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { TeacherRequests } from '@/components/teacher/TeacherRequests';
import { PersonAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/utils';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  // The user arrives from context after /auth/me resolves, so seed once it does.
  useEffect(() => {
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/profile', { phone, email });
      await refreshUser();
      toast.success('Profile saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save your profile'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwdError('Your new password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('The two new passwords do not match.');
      return;
    }
    setPwdError(null);
    setChanging(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(apiErrorMessage(err, 'Could not change your password'));
    } finally {
      setChanging(false);
    }
  };

  const requirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'A letter and a number', met: /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword) },
    {
      label: 'Both new passwords match',
      met: newPassword.length > 0 && newPassword === confirmPassword,
    },
  ];

  return (
    <DashboardShell>
      <div className="max-w-3xl space-y-8">
        <PageHeader title="Profile" />

        <div className="flex items-center gap-4 border-b border-line pb-6">
          <PersonAvatar name={user?.username} className="h-14 w-14" />
          <div>
            <p className="text-section text-ink">{user?.username}</p>
            <p className="text-dense capitalize text-ink-muted">{user?.role?.toLowerCase()}</p>
          </div>
        </div>

        {user?.role === 'TEACHER' && <TeacherRequests />}

        <form onSubmit={saveProfile}>
          <section className="space-y-3">
            <div className="space-y-0.5">
              <h2 className="text-section text-ink">Contact details</h2>
              <p className="text-dense text-ink-muted">How the school reaches you.</p>
            </div>

            <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
              <Row label="Email" htmlFor="profile-email">
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Row>
              <Row label="Phone" htmlFor="profile-phone">
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+8801…"
                />
              </Row>
              <div className="flex justify-end border-t border-line px-4 py-3">
                <Button type="submit" loading={saving}>
                  Save details
                </Button>
              </div>
            </div>
          </section>
        </form>

        <form onSubmit={changePassword}>
          <section className="space-y-3">
            <div className="space-y-0.5">
              <h2 className="text-section text-ink">Password</h2>
              <p className="text-dense text-ink-muted">
                You will stay signed in on this device after changing it.
              </p>
            </div>

            <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
              <Row label="Current password" htmlFor="current-password">
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPwdError(null);
                  }}
                  autoComplete="current-password"
                  required
                />
              </Row>
              <Row label="New password" htmlFor="new-password">
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPwdError(null);
                  }}
                  autoComplete="new-password"
                  required
                />
              </Row>
              <Row label="Repeat new password" htmlFor="confirm-password">
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPwdError(null);
                  }}
                  autoComplete="new-password"
                  required
                />
              </Row>

              {newPassword.length > 0 && (
                <ul className="space-y-1 border-b border-line px-4 py-3">
                  {requirements.map((r) => (
                    <li
                      key={r.label}
                      className={`flex items-center gap-2 text-meta ${r.met ? 'text-success' : 'text-ink-subtle'}`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 ${r.met ? 'opacity-100' : 'opacity-35'}`}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}

              {pwdError && (
                <p role="alert" className="border-b border-line px-4 py-3 text-dense text-danger">
                  {pwdError}
                </p>
              )}

              <div className="flex justify-end px-4 py-3">
                <Button type="submit" loading={changing}>
                  Change password
                </Button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </DashboardShell>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-line px-4 py-3 sm:grid-cols-[minmax(0,12rem)_1fr] sm:items-center sm:gap-4">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div>{children}</div>
    </div>
  );
}
