'use client';

import React from 'react';

interface CarItem {
  name: string;
  bookingsCount: number;
  revenue: number;
  maxRevenue: number;
}

interface TopCarsTableProps {
  cars: CarItem[] | null;
}

export default function TopCarsTable({ cars }: TopCarsTableProps) {
  const list = cars || [];

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  return (
    <div className="flex h-full min-h-[300px] min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Top xe thuê</h3>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:border-slate-800">
              <th className="px-2 py-3">Tên xe</th>
              <th className="px-2 py-3 text-center">Số hợp đồng</th>
              <th className="px-2 py-3 text-right">Tiền hợp đồng</th>
              <th className="hidden w-[160px] px-4 py-3 sm:table-cell">Hiệu suất</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              list.map((car, i) => {
                const ratio = Math.max(5, Math.min(100, Math.round((car.revenue / car.maxRevenue) * 100)));
                return (
                  <tr key={i} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/1 flex-grow">
                    <td className="py-3 px-2 text-gray-900 dark:text-white font-bold">{car.name}</td>
                    <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300 font-bold">{car.bookingsCount}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-right font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(car.revenue)}</td>
                    <td className="hidden py-3 px-4 sm:table-cell">
                      {/* Proportional progress bar */}
                      <div className="w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
