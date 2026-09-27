'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Check, GraduationCap, Users } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api/auth';
import { useSchool, SchoolProvider } from '@/lib/school-context';
import { AuthSplit } from '@/components/layout/AuthSplit';
import { LogoMark } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { apiErrorMessage, cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

/**
 * Self-registration is limited to students and guardians. Staff and admin
 * accounts are created by the office, and the backend enforces the same rule.
 */
const ACCOUNT_TYPES = [
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'You study at this school.',
    icon: GraduationCap,
  },
  {
    value: 'GUARDIAN',
    label: 'Guardian',
    description: 'Your child studies here.',
    icon: Users,
  },
] as const;

export default function RegisterPage() {
  return (
    <SchoolProvider>
      <RegisterScreen />
    </SchoolProvider>
  );
}

function RegisterScreen() {
  const school = useSchool();
  const router = useRouter();

  const [role, setRole] = useState<'STUDENT' | 'GUARDIAN'>('STUDENT');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requirements = [
    { label: t('At least 8 characters'), met: password.length >= 8 },
    { label: t('A letter and a number'), met: /[A-Za-z]/.test(password) && /\d/.test(password) },
    { label: t('Both passwords match'), met: password.length > 0 && password === confirm },
  ];
  const allMet = requirements.every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      setError(t('Your username must be at least 3 characters.'));
      return;
    }
    if (!allMet) {
      setError(t('Please meet all the password requirements.'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authAPI.register({
        username: username.trim(),
        email: email.trim() || undefined,
        password,
        role,
      });
      toast.success(t('Account created — you can sign in now'));
      router.push('/login');
    } catch (err) {
      setError(apiErrorMessage(err, t('Could not create your account')));
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
          <h1 className="text-page text-ink">{t('Create an account')}</h1>
          <p className="text-body text-ink-muted">{school.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-card border border-danger/30 bg-danger-bg px-3 py-2.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
              <p className="text-dense text-danger">{error}</p>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-label font-medium text-ink">{t('I am a')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ACCOUNT_TYPES.map((type) => {
                const active = role === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRole(type.value)}
                    className={cn(
                      'rounded-card border p-3 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                      active
                        ? 'border-brand bg-brand-wash'
                        : 'border-line hover:border-line-strong'
                    )}
                  >
                    <type.icon
                      className={cn('h-4 w-4', active ? 'text-brand' : 'text-ink-subtle')}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'mt-1.5 block text-dense font-medium',
                        active ? 'text-brand' : 'text-ink'
                      )}
                    >
                      {t(type.label)}
                    </span>
                    <span className="mt-0.5 block text-meta text-ink-muted">
                      {t(type.description)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-meta text-ink-subtle">
              {t('Teacher and office accounts are created by the school.')}
            </p>
          </fieldset>

          <Field label={t('Username')} description={t('At least 3 characters.')} required>
            {(p) => (
              <Input
                {...p}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                autoComplete="username"
                disabled={loading}
                required
              />
            )}
          </Field>

          <Field label={t('Email')} description={t('Optional, but useful if you forget your password.')}>
            {(p) => (
              <Input
                {...p}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
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
                  autoComplete="new-password"
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

          <Field label={t('Repeat password')} required>
            {(p) => (
              <Input
                {...p}
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError(null);
                }}
                autoComplete="new-password"
                disabled={loading}
                required
              />
            )}
          </Field>

          {/* The checklist updates as they type, rather than failing on submit. */}
          {password.length > 0 && (
            <ul className="space-y-1">
              {requirements.map((r) => (
                <li
                  key={r.label}
                  className={cn(
                    'flex items-center gap-2 text-meta',
                    r.met ? 'text-success' : 'text-ink-subtle'
                  )}
                >
                  <Check
                    className={cn('h-3.5 w-3.5', r.met ? 'opacity-100' : 'opacity-35')}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                  {t(r.label)}
                </li>
              ))}
            </ul>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {t('Create account')}
          </Button>

          {role === 'GUARDIAN' && (
            <p className="text-meta text-ink-subtle">
              {t('After you sign in, ask the school office to link your child\'s record to this account so you can see their attendance and results.')}
            </p>
          )}
        </form>

        <p className="text-dense text-ink-muted">
          {t('Already have an account?')}{' '}
          <Link
            href="/login"
            className="font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t('Sign in')}
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
