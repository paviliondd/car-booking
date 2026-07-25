'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import type { AuthUser } from '@/lib/api';
import { clearAuthSession, updateStoredAuthUser } from '@/lib/auth-session';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const checkDashboardGuard = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      showError('Bạn cần đăng nhập để truy cập trang quản lý.');
      router.replace('/auth');
      return;
    }

    try {
      const me = await api.auth.me();
      const canAccessDashboard = ['ADMIN', 'STAFF'].includes(me.role);

      if (!canAccessDashboard) {
        showError('Tài khoản của bạn chưa có quyền truy cập trang quản lý.');
        router.replace(me.role === 'OWNER' ? '/owner' : '/');
        return;
      }

      updateStoredAuthUser(me);
      setUser(me);
      setLoading(false);
    } catch {
      queryClient.clear();
      clearAuthSession();
      showError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      router.replace('/auth');
    }
  }, [queryClient, router, showError]);

  useEffect(() => {
    const guardTimer = window.setTimeout(() => void checkDashboardGuard(), 0);
    return () => window.clearTimeout(guardTimer);
  }, [checkDashboardGuard]);

  const handleLogout = () => {
    queryClient.clear();
    clearAuthSession();
    router.replace('/auth');
    router.refresh();
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-night-surface text-night-content">
        <Loader2 className="h-10 w-10 animate-spin text-night-accent" />
        <span className="text-sm font-semibold text-night-secondary">Đang xác thực thông tin...</span>
      </main>
    );
  }

  return (
    <div className="admin-shell flex min-h-dvh max-w-full overflow-x-hidden bg-app-muted text-content transition-colors duration-300">
      <div className="hidden md:block sticky top-0 h-dvh shrink-0 z-30">
        <DashboardSidebar user={user} />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Đóng menu quản trị"
            className="fixed inset-0 bg-night-surface/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative animate-slide-right-custom">
            <DashboardSidebar user={user} onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          user={user}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow overflow-y-auto p-4 sm:p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
