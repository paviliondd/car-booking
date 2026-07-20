'use client';

import React, { useSyncExternalStore, useState } from 'react';
import Link from 'next/link';
import { Car, LogOut, Menu, UserCircle, X } from 'lucide-react';
import AuthModal from '../modals/AuthModal';

type StoredUser = {
  name?: string;
  email?: string;
  role?: string;
};

const navItems = [
  { href: '/about', label: 'Về datxe' },
  { href: '/become-owner', label: 'Trở thành chủ xe' },
];

const getAuthSnapshot = () => {
  const token = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');
  return token && rawUser ? `${token}:${rawUser}` : '';
};

const getServerAuthSnapshot = () => '';

const subscribeToAuth = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener('focus', onStoreChange);
  window.addEventListener('datxe-auth', onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener('focus', onStoreChange);
    window.removeEventListener('datxe-auth', onStoreChange);
  };
};

const parseStoredUser = (snapshot: string): StoredUser | null => {
  if (!snapshot) return null;
  try {
    return JSON.parse(snapshot.slice(snapshot.indexOf(':') + 1)) as StoredUser;
  } catch {
    return null;
  }
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const authSnapshot = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );
  const user = parseStoredUser(authSnapshot);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('datxe-auth'));
    setMobileMenuOpen(false);
  };

  const navLinkClass = 'inline-flex min-h-11 items-center hover:text-[#008F5A] transition font-medium';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-emerald-100 py-4 px-6 md:px-12 flex justify-between items-center text-slate-800 shadow-sm">
      <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[#008F5A]">
        <Car className="h-8 w-8 text-[#008F5A]" />
        <span>dat<span className="text-slate-950">xe</span></span>
      </Link>

      <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={navLinkClass}>
            {item.label}
          </Link>
        ))}

        <div className="h-5 border-r border-emerald-100" />

        {user ? (
          <>
            <Link href={user.role === 'OWNER' ? '/owner' : user.role === 'ADMIN' || user.role === 'STAFF' ? '/dashboard' : '/track'} className="flex items-center gap-2 text-slate-700 hover:text-[#008F5A] transition">
              <UserCircle className="h-5 w-5" />
              <span className="max-w-36 truncate">{user.name || user.email}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="border border-slate-300 hover:border-[#008F5A] hover:text-[#008F5A] hover:bg-emerald-50 transition px-4 py-2 rounded-lg font-semibold cursor-pointer flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Thoát
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="min-h-11 px-2 hover:text-[#008F5A] transition font-semibold cursor-pointer"
            >
              Đăng ký
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="min-h-11 border border-slate-800 hover:border-[#008F5A] hover:text-[#008F5A] hover:bg-emerald-50 transition px-4 py-2 rounded-lg font-semibold cursor-pointer"
            >
              Đăng nhập
            </button>
          </>
        )}
      </nav>

      <button
        type="button"
        className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[69px] right-0 bottom-0 w-72 z-40 bg-white border-l border-emerald-100 p-6 flex flex-col gap-6 shadow-2xl">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="text-base text-slate-700 hover:text-[#008F5A] font-medium">
              {item.label}
            </Link>
          ))}
          <hr className="border-emerald-100" />
          {user ? (
            <>
              <Link href={user.role === 'OWNER' ? '/owner' : user.role === 'ADMIN' || user.role === 'STAFF' ? '/dashboard' : '/track'} onClick={() => setMobileMenuOpen(false)} className="text-base text-slate-700 hover:text-[#008F5A] font-semibold">
                Tài khoản của tôi
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-center border border-slate-800 hover:border-[#008F5A] hover:text-[#008F5A] hover:bg-emerald-50 py-2.5 rounded-lg font-semibold transition cursor-pointer"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="text-left text-base text-slate-700 hover:text-[#008F5A] font-semibold cursor-pointer"
              >
                Đăng ký
              </button>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="w-full text-center border border-slate-800 hover:border-[#008F5A] hover:text-[#008F5A] hover:bg-emerald-50 py-2.5 rounded-lg font-semibold transition cursor-pointer"
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onAuthenticated={() => window.dispatchEvent(new Event('datxe-auth'))}
      />
    </header>
  );
}
