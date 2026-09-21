'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login({ username: username.trim(), password });
      toast.success(`Welcome, ${user.username}!`);
      const redirectMap: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        TEACHER: '/teacher/dashboard',
        STUDENT: '/student/dashboard',
        GUARDIAN: '/guardian/dashboard',
      };
      router.push(redirectMap[user.role] || '/');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Login failed';
      toast.error(message);
      console.error('[Login] error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SchoolOS</h1>
            <p className="text-xs text-slate-500">Barishal Zilla School</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
        <p className="text-slate-500 text-sm mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="username">Username or Email</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username or email"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
          <p className="font-medium text-slate-700 mb-1">Demo credentials</p>
          <p>Admin: <code>admin</code> / <code>Admin@123</code></p>
          <p>Teacher: <code>teacher001</code> / <code>Teacher@123</code></p>
          <p>Student: <code>student001</code> / <code>Student@123</code></p>
          <p>Guardian: <code>guardian001</code> / <code>Guardian@123</code></p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          SchoolOS &copy; 2026 Barishal Zilla School
        </p>
      </div>
    </div>
  );
}
