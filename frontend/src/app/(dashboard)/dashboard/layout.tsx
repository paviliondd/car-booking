'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import ActivityDrawer from '@/components/dashboard/drawers/ActivityDrawer';
import BirthdayDrawer from '@/components/dashboard/drawers/BirthdayDrawer';
import FeedbackModal from '@/components/dashboard/modals/FeedbackModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isBirthdayOpen, setIsBirthdayOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const checkDashboardGuard = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      toast.error('Bạn cần đăng nhập để truy cập trang quản lý.');
      router.push('/auth');
      return;
    }

    try {
      const me = await api.auth.me();
      const canAccessDashboard = ['OWNER', 'ADMIN', 'STAFF'].includes(me.role);

      if (!canAccessDashboard) {
        toast.error('Tài khoản của bạn chưa có quyền truy cập trang quản lý.');
        router.push('/');
        return;
      }

      localStorage.setItem('user', JSON.stringify(me));
      setLoading(false);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      router.push('/auth');
    }
  }, [router, toast]);

  useEffect(() => {
    checkDashboardGuard();
  }, [checkDashboardGuard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14142b] flex flex-col items-center justify-center text-white select-none gap-3">
        <Loader2 className="h-10 w-10 text-[#008F5A] animate-spin" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đang xác thực thông tin...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#14142b] text-gray-900 dark:text-white font-sans transition-colors duration-300">
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative animate-slide-right-custom">
            <DashboardSidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          onOpenActivityDrawer={() => setIsActivityOpen(true)}
          onOpenBirthdayDrawer={() => setIsBirthdayOpen(true)}
          onOpenFeedbackModal={() => setIsFeedbackOpen(true)}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-grow p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <ActivityDrawer isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} />
      <BirthdayDrawer isOpen={isBirthdayOpen} onClose={() => setIsBirthdayOpen(false)} />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
