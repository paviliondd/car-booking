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
      cells.push(<div key={`empty-${i}`} className="h-11" />);
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

      let btnClass = 'text-content dark:text-content hover:bg-app-muted dark:hover:bg-app-surface/5 rounded-md';
      
      if (isPast) {
        btnClass = 'text-content-secondary dark:text-content-secondary cursor-not-allowed';
      } else if (isStart && isEnd) {
        btnClass = 'bg-brand text-on-brand font-extrabold rounded-full';
      } else if (isStart) {
        btnClass = 'bg-brand text-on-brand font-extrabold rounded-l-full rounded-r-none';
      } else if (isEnd) {
        btnClass = 'bg-brand text-on-brand font-extrabold rounded-r-full rounded-l-none';
      } else if (isInRange) {
        btnClass = 'bg-utility text-brand font-semibold rounded-none';
      }

      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => handleDayClick(cellDate)}
          className={`flex h-11 w-full cursor-pointer items-center justify-center text-xs font-semibold transition ${btnClass}`}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  const nextMonthDate = addMonths(currentMonth, 1);

  return (
    <div ref={containerRef} className="relative flex flex-1 items-center gap-3 border-t border-app-border/25 px-3 py-2 select-none dark:border-app-border/30 sm:px-6 md:flex-[1.5] md:border-l md:border-t-0">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
      >
        <CalendarIcon className="h-5 w-5 text-brand flex-shrink-0" />
        <div className="flex-grow">
          <span className="text-[10px] text-content-secondary block font-semibold uppercase tracking-wider">Thời gian thuê</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm font-bold text-content dark:text-night-content truncate">
              {startDate && endDate ? `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}` : 'Chọn thời gian'}
            </span>
            <ChevronDown className="h-4 w-4 text-content-secondary flex-shrink-0" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-[7dvh] z-[95] max-h-[86dvh] w-auto overflow-y-auto rounded-2xl border border-app-border/25 bg-app-surface p-4 text-content shadow-2xl animate-slide-up-custom sm:inset-x-6 sm:p-6 md:absolute md:inset-x-auto md:right-0 md:top-[102%] md:w-[680px]">
          {/* Header Picker Modal */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-content flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-brand" />
              <span>Chọn ngày giờ nhận/trả xe</span>
            </h3>
            <button 
              type="button"
              onClick={handleCancel}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-content-secondary transition hover:bg-app-muted hover:text-content"
              aria-label="Đóng lịch"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-danger-muted border border-danger/30 text-danger p-3 rounded-lg text-xs flex items-center gap-2 mb-4 font-semibold">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TWO MONTHS CALENDAR VIEW */}
          <div className="grid md:grid-cols-2 gap-8 border-b border-app-border/25 pb-6 mb-6">
            {/* 1st Month */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <button type="button" onClick={prevMonth} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-content-secondary hover:bg-app-muted" aria-label="Tháng trước">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-bold text-content">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <div className="w-5" />
              </div>

              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-content-secondary py-1">
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
                <span className="text-sm font-bold text-content">
                  {monthNames[nextMonthDate.getMonth()]} {nextMonthDate.getFullYear()}
                </span>
                <button type="button" onClick={nextMonth} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-content-secondary hover:bg-app-muted" aria-label="Tháng sau">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-content-secondary py-1">
                {dayNames.map((d) => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {renderMonthCalendar(nextMonthDate)}
              </div>
            </div>
          </div>

          {/* TIME SELECTOR (START & END HOURS) */}
          <div className="grid grid-cols-2 gap-6 items-center border-b border-app-border/25 pb-6 mb-6">
            <div>
              <label className="text-xs font-semibold text-content-secondary block mb-2">Giờ Nhận Xe</label>
              <select 
                value={tempStartTime}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="min-h-11 w-full rounded-lg border border-app-border/35 bg-app-muted p-2.5 text-sm text-content focus:border-brand focus:outline-none"
              >
                {timeOptions.map((t) => <option key={`start-${t}`} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-content-secondary block mb-2">Giờ Trả Xe</label>
              <select 
                value={tempEndTime}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="min-h-11 w-full rounded-lg border border-app-border/35 bg-app-muted p-2.5 text-sm text-content focus:border-brand focus:outline-none"
              >
                {timeOptions.map((t) => <option key={`end-${t}`} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Action Confirmation Buttons */}
          <div className="grid grid-cols-2 items-center gap-3 sm:flex sm:justify-end">
            <button 
              type="button" 
              onClick={handleCancel}
              className="min-h-11 cursor-pointer rounded-lg border border-app-border/35 px-6 text-sm font-semibold text-content-secondary transition hover:bg-app-muted"
            >
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleConfirm}
              className="min-h-11 cursor-pointer rounded-lg bg-brand px-8 text-sm font-semibold text-on-brand shadow-sm transition hover:bg-brand-hover"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
