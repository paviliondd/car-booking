'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, ChevronLeft, ChevronRight, FileText, Calendar, 
  Car, FileInput, CheckSquare, Clock, BookOpen, CreditCard, 
  Map, Wrench, List, BarChart3, Info, Landmark, Users, Settings, Phone
} from 'lucide-react';

export default function DashboardSidebar() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar_minimize_state');
      setIsMinimized(stored === 'on');
    }
  }, []);

  const toggleMinimize = () => {
    const nextVal = !isMinimized;
    setIsMinimized(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_minimize_state', nextVal ? 'on' : 'off');
    }
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const sidebarWidthClass = isMinimized ? 'w-[70px]' : 'w-[225px]';

  return (
    <aside className={`flex flex-col bg-[#1e1e2d] text-[#a2a3b7] ${sidebarWidthClass} transition-all duration-300 min-h-screen border-r border-[#2b2b40] z-30 select-none`}>
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between px-4 h-[65px] border-b border-[#2b2b40]">
        {!isMinimized && (
          <div className="flex items-center gap-2">
            <div className="bg-[#00B14F] text-white p-1.5 rounded-lg font-black text-sm tracking-widest">
              G-CAR
            </div>
            <span className="text-white font-extrabold text-xs tracking-wider">DASHBOARD</span>
          </div>
        )}
        <button 
          onClick={toggleMinimize}
          className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-[#2b2b40] cursor-pointer mx-auto md:mx-0"
        >
          {isMinimized ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5 scrollbar-thin">
        {/* OPERATE SECTION (VẬN HÀNH) */}
        <div className="flex flex-col gap-1.5">
          {!isMinimized && (
            <span className="text-[10px] font-bold text-gray-600 tracking-widest uppercase pl-2 mb-1 block">
              VẬN HÀNH
            </span>
          )}

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <FileText className="h-4.5 w-4.5 text-[#00B14F]" />
            {!isMinimized && <span>Hợp đồng ngày</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Menu className="h-4.5 w-4.5" />
            {!isMinimized && <span>Hợp đồng tháng</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Car className="h-4.5 w-4.5" />
            {!isMinimized && <span>Hợp đồng tài xế</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <FileInput className="h-4.5 w-4.5" />
            {!isMinimized && <span>Hợp đồng chuyển đi</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <CheckSquare className="h-4.5 w-4.5" />
            {!isMinimized && <span>Giao nhận xe</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Calendar className="h-4.5 w-4.5" />
            {!isMinimized && <span>Lịch xe</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Clock className="h-4.5 w-4.5" />
            {!isMinimized && <span>Sổ quỹ</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <CreditCard className="h-4.5 w-4.5" />
            {!isMinimized && <span>Công nợ</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Map className="h-4.5 w-4.5" />
            {!isMinimized && <span>Phí đường bộ</span>}
          </Link>

          {/* ACCORDION: BẢO DƯỠNG SỬA CHỮA */}
          <div className="flex flex-col gap-0.5">
            <button 
              onClick={() => toggleAccordion('maintenance')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Wrench className="h-4.5 w-4.5" />
                {!isMinimized && <span>Bảo dưỡng sửa chữa</span>}
              </div>
              {!isMinimized && (
                <span className="text-xs text-gray-500">{openAccordions['maintenance'] ? '▼' : '▶'}</span>
              )}
            </button>
            {!isMinimized && openAccordions['maintenance'] && (
              <div className="pl-9 flex flex-col gap-1 text-xs py-1 border-l border-gray-700 ml-5">
                <Link href="/dashboard" className="hover:text-white py-1">Danh sách phiếu</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Phê duyệt</Link>
              </div>
            )}
          </div>

          {/* ACCORDION: DANH SÁCH */}
          <div className="flex flex-col gap-0.5">
            <button 
              onClick={() => toggleAccordion('lists')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <List className="h-4.5 w-4.5" />
                {!isMinimized && <span>Danh sách</span>}
              </div>
              {!isMinimized && (
                <span className="text-xs text-gray-500">{openAccordions['lists'] ? '▼' : '▶'}</span>
              )}
            </button>
            {!isMinimized && openAccordions['lists'] && (
              <div className="pl-9 flex flex-col gap-1 text-xs py-1 border-l border-gray-700 ml-5">
                <Link href="/dashboard" className="hover:text-white py-1">Khách hàng</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Đối tác</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Danh sách xe</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Tài khoản ngân hàng</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Hoá đơn điện tử</Link>
              </div>
            )}
          </div>

          {/* ACCORDION: BÁO CÁO */}
          <div className="flex flex-col gap-0.5">
            <button 
              onClick={() => toggleAccordion('reports')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4.5 w-4.5" />
                {!isMinimized && <span>Báo cáo</span>}
              </div>
              {!isMinimized && (
                <span className="text-xs text-gray-500">{openAccordions['reports'] ? '▼' : '▶'}</span>
              )}
            </button>
            {!isMinimized && openAccordions['reports'] && (
              <div className="pl-9 flex flex-col gap-1 text-xs py-1 border-l border-gray-700 ml-5">
                <Link href="/dashboard" className="hover:text-white py-1">Hóa đơn</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Chi phí</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Kinh doanh</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Lợi nhuận</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Khách hàng</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Đối tác</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Giao nhận xe</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Nhân viên</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Xe chạy</Link>
                <Link href="/dashboard" className="hover:text-white py-1">Hợp đồng tài xế</Link>
              </div>
            )}
          </div>
        </div>

        {/* GENERAL MANAGEMENT SECTION (QUẢN LÝ CHUNG) */}
        <div className="flex flex-col gap-1.5 mt-2">
          {!isMinimized && (
            <span className="text-[10px] font-bold text-gray-600 tracking-widest uppercase pl-2 mb-1 block">
              QUẢN LÝ CHUNG
            </span>
          )}

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Info className="h-4.5 w-4.5" />
            {!isMinimized && <span>Thông tin doanh nghiệp</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Landmark className="h-4.5 w-4.5" />
            {!isMinimized && <span>Chi nhánh</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Users className="h-4.5 w-4.5" />
            {!isMinimized && <span>Nhân viên và vai trò</span>}
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[#2b2b40] hover:text-white transition">
            <Settings className="h-4.5 w-4.5" />
            {!isMinimized && <span>Cấu hình</span>}
          </Link>
        </div>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-[#2b2b40] bg-[#1a1a27] flex flex-col gap-2">
        <a 
          href="tel:0977847776" 
          className="flex items-center gap-2.5 text-xs text-[#00B14F] font-bold hover:underline py-1.5 px-2 hover:bg-[#2b2b40] rounded-lg transition"
        >
          <Phone className="h-4 w-4" />
          {!isMinimized && <span>Hotline: 0977847776</span>}
        </a>
        <a 
          href="https://zalo.me/0977847776" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-xs text-blue-400 font-bold hover:underline py-1.5 px-2 hover:bg-[#2b2b40] rounded-lg transition"
        >
          <span className="h-4 w-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[8px]">Z</span>
          {!isMinimized && <span>Zalo Hỗ trợ</span>}
        </a>
      </div>
    </aside>
  );
}
