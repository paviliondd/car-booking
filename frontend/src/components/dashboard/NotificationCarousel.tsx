'use client';

import React, { useState } from 'react';
import { BellRing, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NoticeItem {
  id: string;
  title: string;
  desc: string;
  date: string;
}

interface NotificationCarouselProps {
  notices: NoticeItem[] | null;
}

export default function NotificationCarousel({ notices }: NotificationCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const list = notices || [];

  if (list.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-white/5 rounded-2xl p-6 shadow-xs flex items-center justify-center h-[140px] text-xs font-semibold text-gray-400">
        Không có thông báo mới
      </div>
    );
  }

  const current = list[activeIndex];

  return (
    <div className="bg-[#1e1e2d] border border-[#2b2b40] rounded-2xl p-6 shadow-md relative flex flex-col gap-4 text-white h-full overflow-hidden">
      {/* Header and Dots indicators */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <BellRing className="h-4.5 w-4.5 text-[#008F5A] animate-bounce" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Thông báo mới</span>
        </div>
        
        {/* Indicators */}
        <div className="flex gap-1.5">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Xem thông báo ${i + 1}`}
              aria-current={i === activeIndex ? 'true' : undefined}
              onClick={() => setActiveIndex(i)}
              className={`min-h-11 min-w-11 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                i === activeIndex ? 'w-4 bg-[#008F5A]' : 'w-1.5 bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide body with fade animation */}
      <div className="flex-1 flex flex-col justify-between mt-2 z-10 transition-opacity duration-300">
        <div className="flex flex-col gap-1">
          <h4 className="font-extrabold text-sm text-white line-clamp-1">{current.title}</h4>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-semibold">{current.desc}</p>
        </div>

        <div className="flex justify-between items-center border-t border-[#2b2b40] pt-4 mt-2">
          <span className="text-[10px] text-gray-500 font-bold">{current.date}</span>
          <Link
            href="/dashboard/audit"
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[#008F5A] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>Chi tiết</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
