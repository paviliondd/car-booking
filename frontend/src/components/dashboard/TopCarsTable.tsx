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
    <div className="flex h-full min-h-[300px] min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-app-border/40 bg-app-surface p-4 shadow-sm dark:border-app-border/50 dark:bg-app-surface sm:p-6">
      <h3 className="text-lg font-semibold text-content dark:text-content">Top xe thuê</h3>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-app-border/40 text-xs font-semibold text-content-secondary dark:border-app-border/50">
              <th className="px-2 py-3">Tên xe</th>
              <th className="px-2 py-3 text-center">Số hợp đồng</th>
              <th className="px-2 py-3 text-right">Tiền hợp đồng</th>
              <th className="hidden w-[160px] px-4 py-3 sm:table-cell">Hiệu suất</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-content-secondary">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              list.map((car, i) => {
                const ratio =
                  car.maxRevenue > 0 && car.revenue > 0
                    ? Math.max(8, Math.min(100, Math.round((car.revenue / car.maxRevenue) * 100)))
                    : car.bookingsCount > 0
                      ? 15
                      : 0;
                return (
                  <tr key={i} className="border-b border-app-border/30 hover:bg-app-muted flex-grow">
                    <td className="py-3 px-2 text-content font-bold">{car.name}</td>
                    <td className="py-3 px-2 text-center text-content-secondary font-bold">{car.bookingsCount}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-right font-bold tabular-nums text-brand">{formatMoney(car.revenue)}</td>
                    <td className="hidden py-3 px-4 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-app-muted h-2.5 rounded-full overflow-hidden flex-1">
                          <div 
                            className="h-full rounded-full bg-brand transition-all duration-500"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-content-secondary w-9 text-right">{ratio}%</span>
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
