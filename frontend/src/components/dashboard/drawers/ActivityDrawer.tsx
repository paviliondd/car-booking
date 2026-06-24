'use client';

import React from 'react';
import { X, Clock, User, ArrowRight } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockTimeline = [
  { id: '1', time: '21:15', date: 'Hôm nay', user: 'Admin Hà Nội', action: 'Duyệt cọc hợp đồng BK-98721', type: 'success' },
  { id: '2', time: '19:30', date: 'Hôm nay', user: 'Nhân viên A', action: 'Bàn giao xe VinFast VF8 cho KH Nguyễn Văn B', type: 'info' },
  { id: '3', time: '16:00', date: 'Hôm nay', user: 'Hệ thống', action: 'Ghi nhận thanh toán cọc MoMo: 360,000 đ', type: 'payment' },
  { id: '4', time: '14:20', date: 'Hôm nay', user: 'Chủ xe B', action: 'Cập nhật giá cuối tuần cho xe Toyota Vios 30A-888.88', type: 'edit' },
  { id: '5', time: '10:00', date: 'Hôm nay', user: 'Hệ thống', action: 'Cảnh báo: Hợp đồng BK-98211 quá hạn trả xe 2 giờ', type: 'warning' },
  { id: '6', time: '09:00', date: 'Hôm nay', user: 'Admin', action: 'Khóa xe Kia Carnival 30A-111.11 sang trạng thái BẢO TRÌ', type: 'lock' },
];

export default function ActivityDrawer({ isOpen, onClose }: ActivityDrawerProps) {
  const toast = useToast();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Drawer container: w-[300px] mobile, w-[900px] desktop */}
        <div className="w-screen max-w-[300px] md:max-w-[900px] bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col shadow-2xl h-full transform transition duration-300 animate-slide-left-custom">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-[#1e1e2d] text-white">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#00B14F]" />
              <span>Lịch sử thao tác hệ thống</span>
            </h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body List Timeline */}
          <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6">
            <div className="relative border-l border-gray-200 dark:border-white/5 ml-3 pl-6 space-y-6">
              {mockTimeline.map((item) => (
                <div key={item.id} className="relative">
                  {/* Timeline circle node */}
                  <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-950 bg-[#00B14F]" />
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-500 font-bold">
                        {item.time} ({item.date})
                      </span>
                      <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                        <User className="h-3 w-3 text-[#3699FF]" />
                        {item.user}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {item.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer View All Button */}
          <div className="p-4 border-t border-gray-150 dark:border-white/5 flex justify-end">
            <button 
              onClick={() => toast.success('Xem tất cả thao tác')}
              className="bg-[#00B14F] hover:bg-[#009b45] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
