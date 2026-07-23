'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, CalendarClock, Search } from 'lucide-react';
import DateTimePicker from './DateTimePicker';
import LongTermForm from './LongTermForm';
import { useToast } from '@/providers/ToastProvider';

export default function SearchBar() {
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'self-drive' | 'long-term'>('self-drive');
  // Default values: 21:00 T5, 25/06 - 20:00 T6, 26/06
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow
    d.setHours(21, 0, 0, 0);
    return d;
  });
  
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // day after tomorrow
    d.setHours(20, 0, 0, 0);
    return d;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (endDate <= startDate) {
      toast.error('Thời gian trả xe phải sau thời gian nhận xe');
      return;
    }

    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    router.push(`/vehicles?startDate=${encodeURIComponent(startStr)}&endDate=${encodeURIComponent(endStr)}`);
  };

  const handleLongTermSubmit = (data: { startDate: Date; duration: string; endDate: Date | null }) => {
    const startStr = data.startDate.toISOString();
    const endStr = data.endDate ? data.endDate.toISOString() : '';
    router.push(`/vehicles?startDate=${encodeURIComponent(startStr)}&endDate=${encodeURIComponent(endStr)}&duration=${data.duration}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-0 select-none relative z-25">
      {/* Tabs Header */}
      <div className="flex gap-1 mb-[-1px]">
        {/* Tab 1: Xe tự lái */}
        <button
          type="button"
          onClick={() => setActiveTab('self-drive')}
          className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-bold rounded-t-xl transition cursor-pointer ${
            activeTab === 'self-drive'
              ? 'bg-app-surface dark:bg-app-surface text-brand border-t border-x border-app-border/25 dark:border-app-border/30 shadow-xs border-b-2 border-b-brand'
              : 'bg-app-muted text-content-secondary hover:text-content hover:bg-utility border-t border-x border-transparent'
          }`}
        >
          <Key className={`h-4.5 w-4.5 ${activeTab === 'self-drive' ? 'text-brand' : 'text-content-secondary'}`} />
          <span>Xe tự lái</span>
        </button>

        {/* Tab 2: Thuê dài hạn */}
        <button
          type="button"
          onClick={() => setActiveTab('long-term')}
          className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-bold rounded-t-xl transition cursor-pointer ${
            activeTab === 'long-term'
              ? 'bg-app-surface dark:bg-app-surface text-brand border-t border-x border-app-border/25 dark:border-app-border/30 shadow-xs border-b-2 border-b-brand'
              : 'bg-app-muted text-content-secondary hover:text-content hover:bg-utility border-t border-x border-transparent'
          }`}
        >
          <CalendarClock className={`h-4.5 w-4.5 ${activeTab === 'long-term' ? 'text-brand' : 'text-content-secondary'}`} />
          <span>Thuê xe dài hạn</span>
        </button>
      </div>

      {/* Conditional Form Render */}
      {activeTab === 'long-term' ? (
        <LongTermForm onSubmit={handleLongTermSubmit} />
      ) : (
        <form 
          onSubmit={handleSearchSubmit}
          className="bg-app-surface dark:bg-app-surface border border-app-border/25 dark:border-app-border/30 rounded-b-2xl rounded-tr-2xl shadow-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center relative"
        >
          <DateTimePicker 
            startDate={startDate} 
            endDate={endDate} 
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }} 
          />

          {/* Submit Search Button */}
          <div className="px-4 flex items-center">
            <button
              type="submit"
              className="w-full md:w-auto bg-brand hover:bg-brand-hover text-on-brand font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200 disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
              <span>Tìm Xe</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
