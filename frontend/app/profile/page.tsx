'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { DashboardShell } from '@/components/layout/DashboardShell';
import api from '@/lib/api/client';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api.patch('/profile', { phone, email }); await refreshUser(); toast.success('Profile updated'); }
    catch { toast.error('Update failed'); } finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setChangingPwd(true);
    try { await api.patch('/auth/change-password', { currentPassword: oldPwd, newPassword: newPwd }); toast.success('Password changed'); setOldPwd(''); setNewPwd(''); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); } finally { setChangingPwd(false); }
  };

  return (
    <DashboardShell>
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Profile" />
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16"><AvatarFallback className="text-xl">{user ? getInitials(user.username) : 'U'}</AvatarFallback></Avatar>
            <div><p className="font-bold text-slate-900 text-lg">{user?.username}</p><p className="text-slate-500 text-sm capitalize">{user?.role?.toLowerCase()}</p></div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" /></div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold mb-4">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div><Label>Current Password</Label><Input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required className="mt-1" /></div>
            <div><Label>New Password</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required className="mt-1" /></div>
            <Button type="submit" disabled={changingPwd}>{changingPwd ? 'Changing...' : 'Change Password'}</Button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
