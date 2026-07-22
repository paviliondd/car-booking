'use client';

import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';

interface ChartItem {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartItem[] | null;
  selectedMonth: string;
  onMonthChange: (val: string) => void;
}

export default function RevenueChart({ data, selectedMonth, onMonthChange }: RevenueChartProps) {
  
  // Format total revenue sum
  const totalRevenue = data?.reduce((sum, item) => sum + item.revenue, 0) ?? 0;
  
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  const formatYAxis = (val: number) => {
    if (val >= 1000000) return (val / 1000000) + 'M';
    if (val >= 1000) return (val / 1000) + 'k';
    return val.toString();
  };

  // Convert raw dates into short labels (e.g. 2026-06-01 -> "01")
  const formattedData = data?.map((item) => {
    const day = item.date.split('-')[2] || '';
    return {
      name: day,
      revenue: item.revenue,
      rawMoney: formatMoney(item.revenue),
    };
  }) ?? [];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-white/5 rounded-2xl p-6 shadow-xs flex flex-col gap-4 h-full">
      {/* Header with selector */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-bold text-gray-950 dark:text-white">Doanh thu tháng này</h3>
          <span className="text-2xl font-black text-[#008F5A]">
            {formatMoney(totalRevenue)}
          </span>
        </div>

        {/* Month Selector dropdown */}
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="min-h-11 rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs font-bold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-white/5 dark:bg-white/5 dark:text-white"
        >
          {[0, 1, 2].map((offset) => {
            const date = new Date();
            date.setMonth(date.getMonth() - offset);
            const value = date.toISOString().slice(0, 7);
            return <option key={value} value={value}>Tháng {date.getMonth() + 1}, {date.getFullYear()}</option>;
          })}
        </select>
      </div>

      {/* Chart Canvas */}
      <div className="h-[250px] w-full mt-4">
        {formattedData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-gray-400">
            Không có dữ liệu hiển thị
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#008F5A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#008F5A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-5" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip 
                contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                labelFormatter={(label) => `Ngày ${label}`}
                formatter={(value: unknown) => [formatMoney(Number(value || 0)), 'Doanh thu']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#008F5A" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
