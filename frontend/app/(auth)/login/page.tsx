'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSchool, SchoolProvider } from '@/lib/school-context';
import { AuthSplit } from '@/components/layout/AuthSplit';
import { LogoMark } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { apiErrorMessage } from '@/lib/utils';
import { t } from '@/lib/i18n';

const REDIRECTS: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
  GUARDIAN: '/guardian/dashboard',
};

export default function LoginPage() {
  return (
    <SchoolProvider>
      <LoginScreen />
    </SchoolProvider>
  );
}

function LoginScreen() {
  const school = useSchool();
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Middleware only checks whether the accessToken cookie exists. If it has
   * expired but the 7-day refresh token is still valid, middleware sends a
   * still-logged-in visitor here before the axios client gets a chance to
   * silently refresh. Once that refresh completes and AuthProvider's /auth/me
   * resolves, `user` becomes non-null - so send them straight back to their
   * dashboard rather than making them sign in again for no reason.
   */
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(REDIRECTS[user.role] || '/');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(t('Enter your username and password.'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await login({ username: username.trim(), password });
      toast.success(t('Signed in as {username}', { username: user.username }));
      router.push(REDIRECTS[user.role] || '/');
    } catch (err) {
      setError(apiErrorMessage(err, t('Could not sign you in')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplit schoolName={school.name}>
      <div className="space-y-6">
        <div className="lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand text-brand-contrast">
              <LogoMark />
            </span>
            <span className="text-dense font-semibold text-ink">{t('SchoolOS')}</span>
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-page text-ink">{t('Sign in')}</h1>
          <p className="text-body text-ink-muted">{school.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-card border border-danger/30 bg-danger-bg px-3 py-2.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
              <p className="text-dense text-danger">{error}</p>
            </div>
          )}

          <Field label={t('Username or email')} required>
            {(p) => (
              <Input
                {...p}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                autoComplete="username"
                autoFocus
                disabled={loading}
                required
              />
            )}
          </Field>

          <Field label={t('Password')} required>
            {(p) => (
              <div className="relative">
                <Input
                  {...p}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete="current-password"
                  disabled={loading}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('Hide password') : t('Show password')}
                  className="absolute right-1 top-1/2 flex h-7 w-8 -translate-y-1/2 items-center justify-center rounded-chip text-ink-subtle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            )}
          </Field>

          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-dense text-ink-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand/25"
              />
              {t('Keep me signed in')}
            </label>
            <span className="text-meta text-ink-subtle">
              {t('Forgot it? Ask the school office.')}
            </span>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {t('Sign in')}
          </Button>
        </form>

        <div className="rounded-card border border-line bg-surface shadow-card p-3">
          <p className="mb-1.5 text-meta font-medium text-ink">{t('Demo accounts')}</p>
          <dl className="space-y-0.5 text-meta text-ink-muted">
            {[
              ['Admin', 'admin', 'Admin@123'],
              ['Teacher', 'teacher001', 'Teacher@123'],
              ['Student', 'student001', 'Student@123'],
              ['Guardian', 'guardian001', 'Guardian@123'],
            ].map(([role, user, pass]) => (
              <div key={role} className="flex gap-2">
                <dt className="w-16 shrink-0">{role}</dt>
                <dd className="tabular">
                  {user} / {pass}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </AuthSplit>
  );
}
