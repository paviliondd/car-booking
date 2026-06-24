'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

interface LocationDropdownProps {
  value: string;
  onChange: (val: string) => void;
}

const locations = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hội An',
  'Nha Trang',
];

export default function LocationDropdown({ value, onChange }: LocationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 flex items-center gap-3 px-6 py-3 cursor-pointer select-none">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full"
      >
        <MapPin className="h-5 w-5 text-[#00B14F] flex-shrink-0" />
        <div className="flex-grow">
          <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Địa điểm</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {value || 'Chọn địa điểm'}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-[102%] w-full min-w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-2 animate-slide-up-custom">
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                onChange(loc);
                setIsOpen(false);
              }}
              className={`w-full text-left px-5 py-2.5 text-sm transition cursor-pointer hover:bg-gray-50 hover:text-[#00B14F] ${
                value === loc ? 'text-[#00B14F] font-bold bg-[#E0F5E9]/20' : 'text-gray-700'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
