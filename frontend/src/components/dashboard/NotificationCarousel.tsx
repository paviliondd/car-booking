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
      <div className="flex h-[140px] items-center justify-center rounded-2xl border border-app-border/40 bg-app-surface p-6 text-sm font-medium text-content-secondary shadow-sm dark:border-app-border/50 dark:bg-app-surface">
        Không có thông báo mới
      </div>
    );
  }

  const current = list[activeIndex];

  return (
    <section className="relative flex h-full min-h-[300px] flex-col gap-4 overflow-hidden rounded-2xl border border-app-border/50 bg-app-surface p-5 text-content shadow-sm sm:p-6">
      {/* Header and Dots indicators */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-brand" />
          <span className="text-sm font-semibold text-content-secondary">Thông báo mới</span>
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
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <span className={`block h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-4 bg-brand' : 'w-1.5 bg-content-secondary'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Slide body with fade animation */}
      <div className="flex-1 flex flex-col justify-between mt-2 z-10 transition-opacity duration-300">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base font-semibold text-content">{current.title}</h3>
          <p className="line-clamp-3 text-sm font-normal leading-6 text-content-secondary">{current.desc}</p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-app-border/50 pt-4">
          <span className="text-xs font-medium text-content-secondary">{current.date}</span>
          <Link
            href="/dashboard/audit"
            className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <span>Chi tiết</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
