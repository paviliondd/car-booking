'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, format, startOfDay, isBefore, isSameDay } from 'date-fns';

interface LongTermFormProps {
  onSubmit: (data: { startDate: Date; duration: string; endDate: Date | null }) => void;
}

const durationOptions = [
  { label: '1 tháng', value: '1' },
  { label: '2 tháng', value: '2' },
  { label: '3 tháng', value: '3' },
  { label: '6 tháng', value: '6' },
  { label: '12 tháng', value: '12' },
  { label: 'Thỏa thuận', value: 'agreement' },
];

const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const monthNames = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export default function LongTermForm({ onSubmit }: LongTermFormProps) {
  // Default values
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow
    return startOfDay(d);
  });
  const [duration, setDuration] = useState('1'); // default 1 month

  // Picker States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
        setIsDurationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculated End Date
  const getExpectedEndDate = (): Date | null => {
    if (duration === 'agreement') return null;
    const months = parseInt(duration, 10);
    return addMonths(startDate, months);
  };

  const expectedEndDate = getExpectedEndDate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      startDate,
      duration,
      endDate: expectedEndDate,
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8" />);
    }

    const today = startOfDay(new Date());
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const isPast = isBefore(cellDate, today);
      const isSelected = isSameDay(cellDate, startDate);

      let btnClass = 'text-content dark:text-content hover:bg-app-muted dark:hover:bg-app-surface/5 rounded-full';
      if (isPast) {
        btnClass = 'text-content-secondary dark:text-content-secondary cursor-not-allowed';
      } else if (isSelected) {
        btnClass = 'bg-brand text-on-brand font-bold rounded-full';
      }

      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => {
            setStartDate(cellDate);
            setIsDatePickerOpen(false);
          }}
          className={`h-8 w-8 flex items-center justify-center text-xs font-semibold transition cursor-pointer ${btnClass}`}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  return (
    <form 
      onSubmit={handleSearchSubmit}
      className="bg-app-surface dark:bg-app-surface border border-app-border/25 dark:border-app-border/30 rounded-b-2xl rounded-tr-2xl shadow-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center relative"
    >
      {/* Column 2: Start Date Picker */}
      <div 
        ref={datePickerRef} 
        className="relative flex-1 flex items-center gap-3 px-6 py-3 cursor-pointer select-none border-t md:border-t-0 md:border-l border-app-border/25 dark:border-app-border/30"
      >
        <div 
          onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          className="flex items-center gap-3 w-full"
        >
          <CalendarIcon className="h-5 w-5 text-brand flex-shrink-0" />
          <div className="flex-grow">
            <span className="text-[10px] text-content-secondary block font-semibold uppercase tracking-wider">Ngày bắt đầu</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm font-bold text-content dark:text-night-content truncate">
                {format(startDate, 'dd/MM/yyyy')}
              </span>
              <ChevronDown className="h-4 w-4 text-content-secondary flex-shrink-0" />
            </div>
          </div>
        </div>

        {isDatePickerOpen && (
          <div className="absolute left-0 top-[102%] w-[280px] bg-app-surface text-content border border-app-border/25 rounded-2xl shadow-2xl z-30 p-4 animate-slide-up-custom">
            <div className="flex justify-between items-center mb-4">
              <button 
                type="button" 
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} 
                className="p-1 text-content-secondary hover:text-content-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-content">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button 
                type="button" 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                className="p-1 text-content-secondary hover:text-content-secondary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-content-secondary py-1 mb-1">
              {dayNames.map((d) => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {renderCalendar()}
            </div>
          </div>
        )}
      </div>

      {/* Column 3: Duration dropdown */}
      <div 
        ref={durationRef} 
        className="relative flex-1 flex items-center gap-3 px-6 py-3 cursor-pointer select-none border-t md:border-t-0 md:border-l border-app-border/25 dark:border-app-border/30"
      >
        <div 
          onClick={() => setIsDurationOpen(!isDurationOpen)}
          className="flex items-center gap-3 w-full"
        >
          <Clock className="h-5 w-5 text-brand flex-shrink-0" />
          <div className="flex-grow">
            <span className="text-[10px] text-content-secondary block font-semibold uppercase tracking-wider">Thời hạn</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm font-bold text-content dark:text-night-content truncate">
                {durationOptions.find((d) => d.value === duration)?.label || 'Chọn thời hạn'}
              </span>
              <ChevronDown className="h-4 w-4 text-content-secondary flex-shrink-0" />
            </div>
          </div>
        </div>

        {isDurationOpen && (
          <div className="absolute left-0 top-[102%] w-full min-w-[180px] bg-app-surface border border-app-border/25 rounded-xl shadow-xl z-30 py-2 animate-slide-up-custom">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setDuration(opt.value);
                  setIsDurationOpen(false);
                }}
                className={`w-full text-left px-5 py-2.5 text-sm transition cursor-pointer hover:bg-app-muted hover:text-brand ${
                  duration === opt.value ? 'text-brand font-bold bg-utility/20' : 'text-content-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Button & End Date Info */}
      <div className="px-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
        {expectedEndDate && (
          <div className="text-xs text-content-secondary font-semibold text-center md:text-left whitespace-nowrap self-center">
            Dự kiến đến: <span className="text-brand font-bold">{format(expectedEndDate, 'dd/MM/yyyy')}</span>
          </div>
        )}
        <button
          type="submit"
          className="bg-brand hover:bg-brand-hover text-on-brand font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200 disabled:opacity-50"
        >
          <Search className="h-5 w-5" />
          <span>Tìm Xe</span>
        </button>
      </div>
    </form>
  );
}
