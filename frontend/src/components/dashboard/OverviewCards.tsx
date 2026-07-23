'use client';

import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface PeriodData {
  totalContract: number;
  totalMoneyContract: number;
  totalMoneyForward: number;
  totalCollect: number;
  totalExpense: number;
}

interface OverviewCardsProps {
  today: PeriodData | null;
  thisMonth: PeriodData | null;
  lastMonth: PeriodData | null;
}

export default function OverviewCards({ today, thisMonth, lastMonth }: OverviewCardsProps) {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  const renderCard = (title: string, data: PeriodData | null, bgClass: string, foregroundClass: string, secondaryClass: string) => {
    const totalContract = data?.totalContract ?? 0;
    const totalMoneyContract = data?.totalMoneyContract ?? 0;
    const totalMoneyForward = data?.totalMoneyForward ?? 0;
    const totalCollect = data?.totalCollect ?? 0;
    const totalExpense = data?.totalExpense ?? 0;

    return (
      <article className="relative flex min-h-[300px] w-full flex-col overflow-hidden rounded-2xl border border-app-border/40 bg-app-surface shadow-sm dark:border-app-border/50 dark:bg-app-surface">
        {/* Top Segment: Primary Color Block with Wave Pattern */}
        <div className={`relative flex h-[142px] flex-col justify-between p-5 ${bgClass} ${foregroundClass}`}>
          {/* Background SVG Wave Pattern */}
          <div className="absolute inset-x-0 bottom-0 opacity-15 pointer-events-none">
            <svg viewBox="0 0 1440 320" className="w-full h-24 object-cover">
              <path fill="currentColor" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,117.3C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>

          <div className="flex justify-between items-center z-10">
            <span className="text-sm font-semibold">{title}</span>
            <FileSpreadsheet className="h-5 w-5 opacity-70" />
          </div>

          <div className="flex flex-col gap-0.5 pb-4 z-10">
            <span className={`text-sm font-medium ${secondaryClass}`}>Hợp đồng mới</span>
            <span className="text-3xl font-bold tabular-nums">{totalContract}</span>
          </div>
        </div>

        {/* Bottom Segment: Floating Offset White Card Container */}
        <div className="absolute inset-x-4 bottom-4 top-[104px] z-20 flex flex-col justify-between rounded-xl border border-app-border/30 bg-app-surface p-4 shadow-md dark:border-app-border/50 dark:bg-app-surface">
          <div className="grid grid-cols-2 gap-4 text-sm font-medium leading-relaxed text-content-secondary">
            <div>
              <span className="block text-xs text-content-secondary">Tiền hợp đồng</span>
              <span className="mt-1 block break-words font-semibold tabular-nums text-content">{formatMoney(totalMoneyContract)}</span>
            </div>
            <div>
              <span className="block text-xs text-content-secondary">Tiền chuyến đi</span>
              <span className="mt-1 block break-words font-semibold tabular-nums text-content">{formatMoney(totalMoneyForward)}</span>
            </div>
          </div>

          <div className="border-t border-app-border/30 dark:border-app-border/30 pt-3 mt-1 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-content-secondary">Tổng thu</span>
              <span className="text-right text-sm font-bold tabular-nums text-brand dark:text-brand">{formatMoney(totalCollect)}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-content-secondary">Tổng chi</span>
              <span className="text-right text-sm font-bold tabular-nums text-danger dark:text-danger">{formatMoney(totalExpense)}</span>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {renderCard('Hôm nay', today, 'bg-brand', 'text-on-brand', 'text-on-brand')}
      {renderCard('Tháng này', thisMonth, 'bg-brand', 'text-on-brand', 'text-on-brand')}
      {renderCard('Tháng trước', lastMonth, 'bg-night-muted', 'text-night-content', 'text-night-secondary')}
    </div>
  );
}
