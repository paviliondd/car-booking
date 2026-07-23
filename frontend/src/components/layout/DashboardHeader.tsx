'use client';

import { useState } from 'react';
import { ChevronDown, LogOut, Menu, ShieldCheck, User } from 'lucide-react';
import type { AuthUser } from '@/lib/api';

export default function DashboardHeader({ user, onMobileMenuToggle, onLogout }: { user: AuthUser; onMobileMenuToggle: () => void; onLogout: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 flex min-h-[68px] items-center justify-between border-b border-night-border bg-night-surface px-4 text-night-content sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMobileMenuToggle} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-night-secondary hover:bg-night-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-night-accent md:hidden" aria-label="Mở menu quản trị"><Menu className="h-5 w-5" /></button>
        <div><p className="text-sm font-semibold text-night-content sm:text-base">Trung tâm vận hành</p><p className="hidden text-sm text-night-secondary sm:block">Dữ liệu toàn hệ thống theo quyền tài khoản</p></div>
      </div>
      <div className="relative">
        <button type="button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-left hover:bg-night-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-night-accent">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-night-muted text-night-accent"><User className="h-5 w-5" /></span>
          <span className="hidden max-w-44 sm:block"><span className="block truncate text-sm font-semibold">{user.name}</span><span className="block text-xs text-night-secondary">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</span></span>
          <ChevronDown className="h-4 w-4 text-night-secondary" />
        </button>
        {profileOpen && <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-night-border bg-night-muted p-2 shadow-xl">
          <div className="border-b border-night-border px-3 py-3"><p className="font-bold text-night-content">{user.name}</p><p className="mt-1 break-all text-xs text-night-secondary">{user.email}</p><p className="mt-2 inline-flex items-center gap-1 rounded-full bg-night-surface px-2 py-1 text-xs font-bold text-night-accent"><ShieldCheck className="h-3.5 w-3.5" />{user.role}</p></div>
          <button type="button" onClick={onLogout} className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold text-danger hover:bg-night-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"><LogOut className="h-4 w-4" />Đăng xuất</button>
        </div>}
      </div>
    </header>
  );
}
