'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Car, CalendarClock, Search, Loader2 } from 'lucide-react';
import LocationDropdown from './LocationDropdown';
import DateTimePicker from './DateTimePicker';
import { useToast } from '@/providers/ToastProvider';

export default function SearchBar() {
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'self-drive' | 'with-driver' | 'long-term'>('self-drive');
  const [location, setLocation] = useState('TP. Hồ Chí Minh');
  
  // Default values: 21:00 T5, 25/06 - 20:00 T6, 26/06 (simulated from 2026-06-25 21:00 to 2026-06-26 20:00)
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

  const [loading, setLoading] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      toast.error('Vui lòng chọn địa điểm nhận xe');
      return;
    }

    if (endDate <= startDate) {
      toast.error('Thời gian trả xe phải sau thời gian nhận xe');
      return;
    }

    setLoading(true);
    // Simulate loading query
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);

    toast.success(`Tìm xe tại ${location} thành công!`);

    // Redirect to booking detail search page with parameters
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    router.push(`/booking?location=${encodeURIComponent(location)}&startDate=${startStr}&endDate=${endStr}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-0 select-none relative z-20">
      {/* Tabs Header */}
      <div className="flex gap-1 mb-[-1px]">
        {/* Tab 1: Xe tự lái */}
        <button
          onClick={() => setActiveTab('self-drive')}
          className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-bold rounded-t-xl transition cursor-pointer ${
            activeTab === 'self-drive'
              ? 'bg-white dark:bg-[#0b0f19] text-[#00B14F] border-t border-x border-gray-100 dark:border-white/5 shadow-xs'
              : 'bg-gray-100/50 dark:bg-gray-900/40 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 border-t border-x border-transparent'
          }`}
        >
          <Key className={`h-4.5 w-4.5 ${activeTab === 'self-drive' ? 'text-[#00B14F]' : 'text-gray-400'}`} />
          <span>Xe tự lái</span>
        </button>

        {/* Tab 2: Xe có tài xế */}
        <button
          onClick={() => {
            setActiveTab('with-driver');
            toast.warning('Dịch vụ xe có tài xế đang được hoàn thiện!');
          }}
          className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-bold rounded-t-xl transition cursor-pointer ${
            activeTab === 'with-driver'
              ? 'bg-white dark:bg-[#0b0f19] text-[#00B14F] border-t border-x border-gray-100 dark:border-white/5 shadow-xs'
              : 'bg-gray-100/50 dark:bg-gray-900/40 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 border-t border-x border-transparent'
          }`}
        >
          <Car className={`h-4.5 w-4.5 ${activeTab === 'with-driver' ? 'text-[#00B14F]' : 'text-gray-400'}`} />
          <span>Xe có tài xế</span>
        </button>

        {/* Tab 3: Thuê dài hạn */}
        <button
          onClick={() => {
            setActiveTab('long-term');
            toast.warning('Dịch vụ thuê xe dài hạn đang được hoàn thiện!');
          }}
          className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-bold rounded-t-xl transition cursor-pointer ${
            activeTab === 'long-term'
              ? 'bg-white dark:bg-[#0b0f19] text-[#00B14F] border-t border-x border-gray-100 dark:border-white/5 shadow-xs'
              : 'bg-gray-100/50 dark:bg-gray-900/40 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 border-t border-x border-transparent'
          }`}
        >
          <CalendarClock className={`h-4.5 w-4.5 ${activeTab === 'long-term' ? 'text-[#00B14F]' : 'text-gray-400'}`} />
          <span>Thuê xe dài hạn</span>
        </button>
      </div>

      {/* Main Search Panel Bar Container */}
      <form 
        onSubmit={handleSearchSubmit}
        className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 rounded-b-2xl rounded-tr-2xl shadow-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center relative"
      >
        <LocationDropdown 
          value={location} 
          onChange={setLocation} 
        />
        
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
            disabled={loading}
            className="w-full md:w-auto bg-[#00B14F] hover:bg-[#009b45] text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            <span>Tìm Xe</span>
          </button>
        </div>
      </form>
    </div>
  );
}
