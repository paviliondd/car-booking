'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
import { addMonths, subMonths, startOfDay, isBefore, isSameDay } from 'date-fns';
import { formatDateLabel } from '@/lib/utils/date';

interface DateTimePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

// Generate time options from 00:00 to 23:30 (step 30 mins)
const timeOptions: string[] = [];
for (let h = 0; h < 24; h++) {
  const hr = h.toString().padStart(2, '0');
  timeOptions.push(`${hr}:00`);
  timeOptions.push(`${hr}:30`);
}

const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const monthNames = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const formatTime = (date: Date) =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

export default function DateTimePicker({ startDate, endDate, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary selection states
  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);
  const [tempStartTime, setTempStartTime] = useState(() => formatTime(startDate));
  const [tempEndTime, setTempEndTime] = useState(() => formatTime(endDate));
  const [errorMsg, setErrorMsg] = useState('');

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState<Date>(startDate);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');

  const handleCancel = useCallback(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setTempStartTime(formatTime(startDate));
    setTempEndTime(formatTime(endDate));
    setErrorMsg('');
    setIsOpen(false);
  }, [startDate, endDate]);

  const handleToggle = () => {
    if (!isOpen) {
      setTempStart(startDate);
      setTempEnd(endDate);
      setTempStartTime(formatTime(startDate));
      setTempEndTime(formatTime(endDate));
      setCurrentMonth(startDate);
      setSelecting('start');
      setErrorMsg('');
    }
    setIsOpen((open) => !open);
  };

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleCancel]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handleDayClick = (date: Date) => {
    setErrorMsg('');
    const clickedDate = startOfDay(date);

    if (selecting === 'start' || !tempStart) {
      setTempStart(clickedDate);
      setTempEnd(null);
      setSelecting('end');
    } else {
      if (isBefore(clickedDate, startOfDay(tempStart))) {
        setTempStart(clickedDate);
        setTempEnd(null);
        setSelecting('end');
      } else {
        setTempEnd(clickedDate);
        setSelecting('start');
      }
    }
  };

  const handleTimeChange = (type: 'start' | 'end', timeStr: string) => {
    setErrorMsg('');
    if (type === 'start') {
      setTempStartTime(timeStr);
    } else {
      setTempEndTime(timeStr);
    }
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!tempStart || !tempEnd) {
      setErrorMsg('Vui lòng chọn cả ngày bắt đầu và kết thúc');
      return;
    }

    const finalStart = new Date(tempStart);
    const [sh, sm] = tempStartTime.split(':').map(Number);
    finalStart.setHours(sh, sm, 0, 0);

    const finalEnd = new Date(tempEnd);
    const [eh, em] = tempEndTime.split(':').map(Number);
    finalEnd.setHours(eh, em, 0, 0);

    if (finalEnd <= finalStart) {
      setErrorMsg('Thời gian trả xe phải sau thời gian nhận xe');
      return;
    }

    setErrorMsg('');
    onChange(finalStart, finalEnd);
    setIsOpen(false);
  };

  const renderMonthCalendar = (monthDate: Date) => {
    const daysInMonth = getDaysInMonth(monthDate);
    const firstDay = getFirstDayOfMonth(monthDate);
    const cells: React.ReactNode[] = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-9" />);
    }

    const today = startOfDay(new Date());
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const isPast = isBefore(cellDate, today);
      
      const isStart = tempStart && isSameDay(cellDate, tempStart);
      const isEnd = tempEnd && isSameDay(cellDate, tempEnd);
      const isInRange = tempStart && tempEnd && cellDate > tempStart && cellDate < tempEnd;

      let btnClass = 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md';
      
      if (isPast) {
        btnClass = 'text-gray-300 dark:text-gray-600 cursor-not-allowed';
      } else if (isStart && isEnd) {
        btnClass = 'bg-[#008F5A] text-white font-extrabold rounded-full';
      } else if (isStart) {
        btnClass = 'bg-[#008F5A] text-white font-extrabold rounded-l-full rounded-r-none';
      } else if (isEnd) {
        btnClass = 'bg-[#008F5A] text-white font-extrabold rounded-r-full rounded-l-none';
      } else if (isInRange) {
        btnClass = 'bg-[#E8F5E9] text-[#008F5A] font-semibold rounded-none';
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

  const nextMonthDate = addMonths(currentMonth, 1);

  return (
    <div ref={containerRef} className="relative flex-1 md:flex-[1.5] flex items-center gap-3 px-6 py-3 cursor-pointer select-none border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5">
      <div 
        onClick={handleToggle}
        className="flex items-center gap-3 w-full"
      >
        <CalendarIcon className="h-5 w-5 text-[#008F5A] flex-shrink-0" />
        <div className="flex-grow">
          <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Thời gian thuê</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {startDate && endDate ? `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}` : 'Chọn thời gian'}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-[102%] w-[90vw] md:w-[680px] bg-white text-gray-900 border border-gray-100 rounded-2xl shadow-2xl z-35 p-6 animate-slide-up-custom max-h-[85vh] overflow-y-auto">
          {/* Header Picker Modal */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[#008F5A]" />
              <span>Chọn ngày giờ nhận/trả xe</span>
            </h3>
            <button 
              type="button"
              onClick={handleCancel}
              className="p-1 rounded-full hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
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
                <button type="button" onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-bold text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <div className="w-5" />
              </div>

              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 py-1">
                {dayNames.map((d) => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {renderMonthCalendar(currentMonth)}
              </div>
            </div>

            {/* 2nd Month */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="w-5" />
                <span className="text-sm font-bold text-gray-900">
                  {monthNames[nextMonthDate.getMonth()]} {nextMonthDate.getFullYear()}
                </span>
                <button type="button" onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 py-1">
                {dayNames.map((d) => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {renderMonthCalendar(nextMonthDate)}
              </div>
            </div>
          </div>

          {/* TIME SELECTOR (START & END HOURS) */}
          <div className="grid grid-cols-2 gap-6 items-center border-b border-gray-100 pb-6 mb-6">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2">Giờ Nhận Xe</label>
              <select 
                value={tempStartTime}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#008F5A]"
              >
                {timeOptions.map((t) => <option key={`start-${t}`} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2">Giờ Trả Xe</label>
              <select 
                value={tempEndTime}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#008F5A]"
              >
                {timeOptions.map((t) => <option key={`end-${t}`} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Action Confirmation Buttons */}
          <div className="flex gap-4 items-center justify-end">
            <button 
              type="button" 
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleConfirm}
              className="bg-[#008F5A] hover:bg-[#007A4D] text-white px-8 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
