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
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-white/5 rounded-2xl p-6 shadow-xs flex flex-col gap-4 select-none h-full overflow-x-auto min-h-[300px]">
      <h3 className="text-base font-bold text-gray-950 dark:text-white">Top xe thuê</h3>
      
      <div className="flex-1 min-w-[500px]">
        <table className="w-full text-left text-xs font-semibold border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-2">Tên Xe</th>
              <th className="py-3 px-2 text-center">Số Hợp Đồng</th>
              <th className="py-3 px-2 text-right">Tiền Hợp Đồng</th>
              <th className="py-3 px-4 w-[160px]">Hiệu Suất</th>
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
                    <td className="py-3 px-2 text-right text-[#008F5A] font-extrabold">{formatMoney(car.revenue)}</td>
                    <td className="py-3 px-4">
                      {/* Proportional progress bar */}
                      <div className="w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#008F5A] h-full rounded-full transition-all duration-500" 
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
