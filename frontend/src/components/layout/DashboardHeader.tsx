'use client';

import { useState } from 'react';
import { ChevronDown, LogOut, Menu, ShieldCheck, User } from 'lucide-react';
import type { AuthUser } from '@/lib/api';

export default function DashboardHeader({ user, onMobileMenuToggle, onLogout }: { user: AuthUser; onMobileMenuToggle: () => void; onLogout: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 flex min-h-[68px] items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-white sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMobileMenuToggle} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 md:hidden" aria-label="Mở menu quản trị"><Menu className="h-5 w-5" /></button>
        <div><p className="text-sm font-semibold text-white sm:text-base">Trung tâm vận hành</p><p className="hidden text-sm text-slate-400 sm:block">Dữ liệu toàn hệ thống theo quyền tài khoản</p></div>
      </div>
      <div className="relative">
        <button type="button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-left hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"><User className="h-5 w-5" /></span>
          <span className="hidden max-w-44 sm:block"><span className="block truncate text-sm font-semibold">{user.name}</span><span className="block text-xs text-slate-400">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</span></span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
        {profileOpen && <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
          <div className="border-b border-slate-800 px-3 py-3"><p className="font-bold text-white">{user.name}</p><p className="mt-1 break-all text-xs text-slate-400">{user.email}</p><p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" />{user.role}</p></div>
          <button type="button" onClick={onLogout} className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold text-red-300 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><LogOut className="h-4 w-4" />Đăng xuất</button>
        </div>}
      </div>
    </header>
  );
}
