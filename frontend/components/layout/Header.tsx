'use client';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps { title: string; onMenuClick?: () => void; }
export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => { await logout(); router.push('/login'); };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-30">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
      <h1 className="text-lg font-semibold text-slate-900 flex-1">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative group">
          <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user ? getInitials(user.username || 'U') : 'U'}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.username}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 hidden group-hover:block z-50">
            <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"><User className="h-4 w-4" />Profile</Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
}
