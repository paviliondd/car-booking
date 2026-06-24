'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

interface DateTimePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

const timeOptions: string[] = [];
for (let h = 0; h < 24; h++) {
  const hr = h.toString().padStart(2, '0');
  timeOptions.push(`${hr}:00`);
  timeOptions.push(`${hr}:30`);
}

const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function DateTimePicker({ startDate, endDate, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary selection states until "Confirm" is clicked
  const [tempStart, setTempStart] = useState<Date>(startDate);
  const [tempEnd, setTempEnd] = useState<Date>(endDate);
  const [errorMsg, setErrorMsg] = useState('');

  // Calendar states (current month index 0 to 11, year)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update temp states when props change
  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  const getDayOfWeekName = (date: Date) => {
    const dayIndex = date.getDay();
    return dayNames[dayIndex];
  };

  const formatDateLabel = (date: Date) => {
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const dayName = getDayOfWeekName(date);
    const dd = date.getDate().toString().padStart(2, '0');
    const mo = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${hh}:${mm} ${dayName}, ${dd}/${mo}`;
  };

  // Helper date generators
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Calendar Month Render
  const renderMonthCalendar = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: React.ReactNode[] = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-9" />);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const isPast = cellDate < today;
      
      const isStart = tempStart && cellDate.toDateString() === tempStart.toDateString();
      const isEnd = tempEnd && cellDate.toDateString() === tempEnd.toDateString();
      const isInRange = tempStart && tempEnd && cellDate > tempStart && cellDate < tempEnd;

      let btnClass = 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5';
      if (isPast) {
        btnClass = 'text-gray-300 dark:text-gray-600 cursor-not-allowed';
      } else if (isStart || isEnd) {
        btnClass = 'bg-[#00B14F] text-white font-extrabold rounded-lg';
      } else if (isInRange) {
        btnClass = 'bg-[#E0F5E9]/50 dark:bg-[#00B14F]/10 text-[#00B14F] font-semibold';
      }

      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => handleDayClick(cellDate)}
          className={`h-9 w-full flex items-center justify-center text-xs font-semibold transition cursor-pointer ${btnClass}`}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  const handleDayClick = (date: Date) => {
    setErrorMsg('');
    // Keep time parts
    const startHour = tempStart.getHours();
    const startMin = tempStart.getMinutes();
    const endHour = tempEnd.getHours();
    const endMin = tempEnd.getMinutes();

    // 1. If start is not selected, or both selected, reset selection
    if (!tempStart || (tempStart && tempEnd)) {
      const newStart = new Date(date);
      newStart.setHours(startHour, startMin, 0, 0);
      setTempStart(newStart);
      setTempEnd(null as any);
    } 
    // 2. If start is selected but end is not
    else {
      if (date < tempStart) {
        const newStart = new Date(date);
        newStart.setHours(startHour, startMin, 0, 0);
        setTempStart(newStart);
      } else {
        const newEnd = new Date(date);
        newEnd.setHours(endHour, endMin, 0, 0);
        setTempEnd(newEnd);
      }
    }
  };

  const handleTimeChange = (type: 'start' | 'end', timeStr: string) => {
    setErrorMsg('');
    const [h, m] = timeStr.split(':').map(Number);
    if (type === 'start') {
      const newStart = new Date(tempStart);
      newStart.setHours(h, m, 0, 0);
      setTempStart(newStart);
    } else {
      const newEnd = new Date(tempEnd || tempStart);
      newEnd.setHours(h, m, 0, 0);
      setTempEnd(newEnd);
    }
  };

  const nextMonths = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonths = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const getNextMonthAndYear = () => {
    if (currentMonth === 11) {
      return { month: 0, year: currentYear + 1 };
    }
    return { month: currentMonth + 1, year: currentYear };
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const nextMonthInfo = getNextMonthAndYear();

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!tempStart || !tempEnd) {
      setErrorMsg('Vui lòng chọn cả ngày bắt đầu và kết thúc');
      return;
    }
    if (tempEnd <= tempStart) {
      setErrorMsg('Thời gian trả xe phải sau thời gian nhận xe');
      return;
    }
    setErrorMsg('');
    onChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 md:flex-[1.5] flex items-center gap-3 px-6 py-3 cursor-pointer select-none border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full"
      >
        <CalendarIcon className="h-5 w-5 text-[#00B14F] flex-shrink-0" />
        <div className="flex-grow">
          <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Thời gian thuê</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {tempStart && tempEnd ? `${formatDateLabel(tempStart)} - ${formatDateLabel(tempEnd)}` : 'Chọn thời gian'}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-[102%] w-[90vw] md:w-[680px] bg-white text-gray-900 border border-gray-100 rounded-2xl shadow-2xl z-30 p-6 animate-slide-up-custom max-h-[85vh] overflow-y-auto">
          {/* Header Picker Modal */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[#00B14F]" />
              <span>Chọn ngày giờ nhận/trả xe</span>
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2 mb-4 font-semibold">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TWO MONTHS CALENDAR VIEW */}
          <div className="grid md:grid-cols-2 gap-8 border-b border-gray-100 pb-6 mb-6">
            {/* 1st Month */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <button type="button" onClick={prevMonths} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-bold text-gray-900">{monthNames[currentMonth]} {currentYear}</span>
                <div className="w-5" /> {/* empty placeholder spacer */}
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 py-1">
                {dayNames.map((d) => <div key={d}>{d}</div>)}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-y-1">
                {renderMonthCalendar(currentYear, currentMonth)}
              </div>
            </div>

            {/* 2nd Month */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="w-5" />
                <span className="text-sm font-bold text-gray-900">{monthNames[nextMonthInfo.month]} {nextMonthInfo.year}</span>
                <button type="button" onClick={nextMonths} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 py-1">
                {dayNames.map((d) => <div key={d}>{d}</div>)}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-y-1">
                {renderMonthCalendar(nextMonthInfo.year, nextMonthInfo.month)}
              </div>
            </div>
          </div>

          {/* TIME SELECTOR (START & END HOURS) */}
          <div className="grid grid-cols-2 gap-6 items-center border-b border-gray-100 pb-6 mb-6">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2">Giờ Nhận Xe</label>
              <select 
                value={`${tempStart.getHours().toString().padStart(2, '0')}:${tempStart.getMinutes().toString().padStart(2, '0')}`}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#00B14F]"
              >
                {timeOptions.map((t) => <option key={`start-${t}`} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2">Giờ Trả Xe</label>
              <select 
                value={tempEnd ? `${tempEnd.getHours().toString().padStart(2, '0')}:${tempEnd.getMinutes().toString().padStart(2, '0')}` : '20:00'}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#00B14F]"
              >
                {timeOptions.map((t) => <option key={`end-${t}`} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Action Confirmation Buttons */}
          <div className="flex gap-4 items-center justify-end">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleConfirm}
              className="bg-[#00B14F] hover:bg-[#009b45] text-white px-8 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
