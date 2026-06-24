'use client';

import React from 'react';
import { X, Gift, ArrowRight } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

interface BirthdayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockBirthdayTimeline = [
  {
    day: 'Hôm nay (24/06)',
    list: [
      { name: 'Nguyễn Văn Khách', role: 'Khách hàng', type: 'regular', color: 'bg-emerald-500' },
      { name: 'Trần Văn C', role: 'Chủ xe/Đối tác', type: 'partner', color: 'bg-emerald-500' },
    ]
  },
  {
    day: 'Ngày mai (25/06)',
    list: [
      { name: 'Lê Thị Thu', role: 'Khách hàng VIP', type: 'vip', color: 'bg-amber-500' },
    ]
  },
  {
    day: 'Ngày kia (26/06)',
    list: [
      { name: 'Phạm Văn Hùng', role: 'Khách hàng', type: 'regular', color: 'bg-emerald-500' },
      { name: 'Nguyễn Thị Lan', role: 'Chủ xe/Đối tác', type: 'partner', color: 'bg-emerald-500' },
    ]
  }
];

export default function BirthdayDrawer({ isOpen, onClose }: BirthdayDrawerProps) {
  const toast = useToast();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Drawer container: 300px mobile, 600px desktop */}
        <div className="w-screen max-w-[300px] md:max-w-[600px] bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col shadow-2xl h-full transform transition duration-300 animate-slide-left-custom">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-150 dark:border-white/5 flex justify-between items-center bg-[#1e1e2d] text-white">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Gift className="h-5 w-5 text-pink-500" />
              <span>Lịch sinh nhật</span>
            </h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Timeline list */}
          <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6">
            {mockBirthdayTimeline.map((group, groupIdx) => (
              <div key={groupIdx} className="flex flex-col gap-3">
                <span className="text-xs font-bold text-[#008F5A] border-b border-gray-100 dark:border-white/5 pb-1">
                  {group.day}
                </span>

                <div className="flex flex-col gap-2">
                  {group.list.map((item, itemIdx) => (
                    <div 
                      key={itemIdx}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/1"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800 dark:text-white">{item.name}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{item.role}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toast.success(`Mở xem thông tin: ${item.name}`)}
                        className="text-[10px] text-[#3699FF] font-bold border border-[#3699FF]/20 px-2.5 py-1 rounded hover:bg-emerald-500/10 cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
            <button 
              onClick={() => toast.success('Xem toàn bộ lịch sinh nhật tháng')}
              className="bg-[#008F5A] hover:bg-[#007A4D] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <span>Xem lịch tháng</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
