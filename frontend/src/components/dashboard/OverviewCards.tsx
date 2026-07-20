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

  const renderCard = (title: string, data: PeriodData | null, bgClass: string) => {
    const totalContract = data?.totalContract ?? 0;
    const totalMoneyContract = data?.totalMoneyContract ?? 0;
    const totalMoneyForward = data?.totalMoneyForward ?? 0;
    const totalCollect = data?.totalCollect ?? 0;
    const totalExpense = data?.totalExpense ?? 0;

    return (
      <div className="flex flex-col relative w-full h-[320px] rounded-2xl overflow-hidden shadow-lg select-none">
        {/* Top Segment: Primary Color Block with Wave Pattern */}
        <div className={`h-[150px] ${bgClass} p-5 text-white relative flex flex-col justify-between`}>
          {/* Background SVG Wave Pattern */}
          <div className="absolute inset-x-0 bottom-0 opacity-15 pointer-events-none">
            <svg viewBox="0 0 1440 320" className="w-full h-24 object-cover">
              <path fill="#ffffff" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,117.3C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>

          <div className="flex justify-between items-center z-10">
            <span className="text-sm font-black tracking-wider uppercase opacity-90">{title}</span>
            <FileSpreadsheet className="h-5 w-5 opacity-70" />
          </div>

          <div className="flex flex-col gap-0.5 pb-4 z-10">
            <span className="text-xs opacity-75 font-semibold">Hợp đồng mới</span>
            <span className="text-3xl font-black">{totalContract}</span>
          </div>
        </div>

        {/* Bottom Segment: Floating Offset White Card Container */}
        <div className="absolute inset-x-4 bottom-4 top-[110px] bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 flex flex-col justify-between border border-gray-100 dark:border-white/5 z-20">
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 font-semibold leading-relaxed">
            <div>
              <span className="block text-[10px] text-gray-400">TIỀN HỢP ĐỒNG</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{formatMoney(totalMoneyContract)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400">TIỀN CHUYỂN ĐI</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{formatMoney(totalMoneyForward)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-1 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-bold">TỔNG THU</span>
              <span className="text-sm font-extrabold text-[#3699FF]">{formatMoney(totalCollect)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-bold">TỔNG CHI</span>
              <span className="text-sm font-extrabold text-[#F64E60]">{formatMoney(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {renderCard('Hôm nay', today, 'bg-[#3699FF]')}
      {renderCard('Tháng này', thisMonth, 'bg-[#1BC5BD]')}
      {renderCard('Tháng trước', lastMonth, 'bg-[#F64E60]')}
    </div>
  );
}
