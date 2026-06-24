'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, Bell, Shield, ShieldAlert, Award, FileClock, Gift, HelpCircle, 
  ChevronDown, Landmark, LogOut, Key, User, Lock, Sparkles
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { dashboardApi } from '@/lib/api/dashboard';

interface DashboardHeaderProps {
  onOpenActivityDrawer: () => void;
  onOpenBirthdayDrawer: () => void;
  onOpenFeedbackModal: () => void;
  onMobileMenuToggle: () => void;
}

const branches = [
  { id: 'hn', name: 'Hội sở Hà Nội', address: '12 Khuất Duy Tiến, Thanh Xuân', phone: '0977847776' },
  { id: 'hcm', name: 'Chi nhánh Hồ Chí Minh', address: '131 Xô Viết Nghệ Tĩnh, Bình Thạnh', phone: '0977847778' },
  { id: 'dn', name: 'Chi nhánh Đà Nẵng', address: '45 Lê Duẩn, Hải Châu', phone: '0977847779' },
];

export default function DashboardHeader({
  onOpenActivityDrawer,
  onOpenBirthdayDrawer,
  onOpenFeedbackModal,
  onMobileMenuToggle,
}: DashboardHeaderProps) {
  const router = useRouter();
  const toast = useToast();
  
  // Dropdown states
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);
  const [userEmail, setUserEmail] = useState('owner@datxe.linuxunity.com');

  // Badge alert counts
  const [notifyCount, setNotifyCount] = useState(2);
  const [violateCount, setViolateCount] = useState(2);
  const [workingCount, setWorkingCount] = useState(5);

  const branchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dashboardApi.logout();
      localStorage.removeItem('token');
      toast.success('Đăng xuất thành công!');
      router.push('/');
    } catch {
      localStorage.removeItem('token');
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 h-[65px] bg-[#1e1e2d] border-b border-[#2b2b40] px-6 flex justify-between items-center text-white select-none">
      {/* Mobile Hamburger & Logo */}
      <div className="flex items-center gap-3 md:hidden">
        <button 
          onClick={onMobileMenuToggle}
          className="p-1.5 hover:bg-[#2b2b40] rounded-lg transition"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-black text-[#008F5A] text-lg tracking-wider">datxe</span>
      </div>

      {/* Center: Branch Picker ("Hội sở" Dropdown) */}
      <div ref={branchRef} className="relative hidden md:block">
        <button 
          onClick={() => setIsBranchOpen(!isBranchOpen)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-[#2b2b40] rounded-lg transition cursor-pointer text-sm font-semibold border border-[#2b2b40]"
        >
          <Landmark className="h-4.5 w-4.5 text-[#008F5A]" />
          <span>{selectedBranch.name}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {isBranchOpen && (
          <div className="absolute left-0 top-[105%] w-[320px] bg-[#1e1e2d] border border-[#2b2b40] rounded-xl shadow-2xl z-30 p-2 flex flex-col gap-1.5 animate-slide-up-custom">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBranch(b);
                  setIsBranchOpen(false);
                  toast.success(`Chuyển sang ${b.name}`);
                }}
                className={`w-full text-left p-3 rounded-lg text-xs transition cursor-pointer flex flex-col gap-1 ${
                  selectedBranch.id === b.id 
                    ? 'border border-[#008F5A] bg-[#E6F7EF]/10 text-[#008F5A]' 
                    : 'border border-transparent hover:bg-[#2b2b40] text-gray-400'
                }`}
              >
                <span className="font-bold text-sm text-white">{b.name}</span>
                <span className="text-gray-500 font-semibold">{b.address}</span>
                <span className="text-gray-500 font-semibold">SĐT: {b.phone}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Toolbar Icons & Profile */}
      <div className="flex items-center gap-4 ml-auto md:ml-0">
        
        {/* Action icons toolbar */}
        <div className="flex items-center gap-2">
          {/* Car Notify Alert Indicator Button */}
          <button 
            onClick={() => router.push('/dashboard')} // maps /car/notify normally
            className="relative p-2 hover:bg-[#2b2b40] rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Xe đến hạn đăng kiểm/bảo hiểm"
          >
            <Bell className="h-5 w-5" />
            {notifyCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {notifyCount}
              </span>
            )}
          </button>

          {/* Car Violate Indicator Button */}
          <button 
            onClick={() => router.push('/dashboard')} // maps /car/violate
            className="relative p-2 hover:bg-[#2b2b40] rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Phạt nguội chưa xử lý"
          >
            <ShieldAlert className="h-5 w-5" />
            {violateCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {violateCount}
              </span>
            )}
          </button>

          {/* Car Working Status Button */}
          <button 
            onClick={() => router.push('/dashboard')} // maps /car/status-working
            className="relative p-2 hover:bg-[#2b2b40] rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Xe đang chạy"
          >
            <Key className="h-5 w-5" />
            {workingCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-yellow-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {workingCount}
              </span>
            )}
          </button>

          {/* Vertical Separator */}
          <div className="h-5 border-r border-[#2b2b40] mx-1" />

          {/* Operations History Drawer Button */}
          <button 
            onClick={onOpenActivityDrawer}
            className="p-2 hover:bg-[#2b2b40] rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Lịch sử thao tác"
          >
            <FileClock className="h-5 w-5" />
          </button>

          {/* Birthday Calendar Drawer Button */}
          <button 
            onClick={onOpenBirthdayDrawer}
            className="p-2 hover:bg-[#2b2b40] rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Lịch sinh nhật hôm nay"
          >
            <Gift className="h-5 w-5" />
          </button>

          {/* FAQ link Button */}
          <button 
            onClick={() => router.push('/dashboard')} // maps FAQ /user/faq
            className="p-2 hover:bg-[#2b2b40] rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Hướng dẫn sử dụng FAQ"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

        {/* User profile dropdown avatar */}
        <div ref={profileRef} className="relative border-l border-[#2b2b40] pl-4">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 hover:bg-[#2b2b40] px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-[#008F5A]/10 border border-[#008F5A]/30 flex items-center justify-center text-[#008F5A] font-bold">
              O
            </div>
            <span className="hidden lg:block text-xs font-bold text-gray-300">Chủ xe</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-[110%] w-[260px] bg-[#1e1e2d] border border-[#2b2b40] rounded-xl shadow-2xl z-30 py-2 animate-slide-up-custom text-xs">
              {/* Header profile info */}
              <div className="px-4 py-3 border-b border-[#2b2b40] flex flex-col gap-1">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Chủ xe đối tác</span>
                  <span className="bg-amber-400/20 text-amber-400 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 fill-current" />
                    VIP
                  </span>
                </span>
                <span className="text-gray-500 font-semibold">{userEmail}</span>
                <span className="text-[10px] text-gray-600 mt-1">Hạn tài khoản: 31-12-2026</span>
              </div>

              {/* Action list */}
              <div className="p-1 flex flex-col gap-0.5">
                <button onClick={() => toast.success('Màn hình đang phát triển!')} className="w-full text-left px-3 py-2 rounded-md hover:bg-[#2b2b40] transition text-gray-400 hover:text-white flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Thông tin tài khoản</span>
                </button>
                <button onClick={() => toast.success('Màn hình đang phát triển!')} className="w-full text-left px-3 py-2 rounded-md hover:bg-[#2b2b40] transition text-gray-400 hover:text-white flex items-center gap-2 cursor-pointer">
                  <Lock className="h-4 w-4" />
                  <span>Đổi mật khẩu</span>
                </button>
                <button onClick={() => toast.success('Màn hình đang phát triển!')} className="w-full text-left px-3 py-2 rounded-md hover:bg-[#2b2b40] transition text-gray-400 hover:text-white flex items-center gap-2 cursor-pointer">
                  <FileClock className="h-4 w-4" />
                  <span>Lịch sử đăng nhập</span>
                </button>
                <button onClick={() => toast.success('Gia hạn tài khoản thành công')} className="w-full text-left px-3 py-2 rounded-md hover:bg-[#2b2b40] transition text-gray-400 hover:text-white flex items-center gap-2 cursor-pointer">
                  <Award className="h-4 w-4" />
                  <span>Gia hạn tài khoản</span>
                </button>
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenFeedbackModal();
                  }} 
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-[#2b2b40] transition text-gray-400 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Góp ý & đề xuất</span>
                </button>
              </div>

              {/* Footer logout */}
              <div className="border-t border-[#2b2b40] p-1 mt-1">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-red-500/10 text-red-400 font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
