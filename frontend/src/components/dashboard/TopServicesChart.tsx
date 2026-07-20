'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ServiceItem {
  name: string;
  value: number;
}

interface TopServicesChartProps {
  data: ServiceItem[] | null;
}

const COLORS = ['#008F5A', '#3699FF', '#F64E60', '#1BC5BD', '#8950FC'];

export default function TopServicesChart({ data }: TopServicesChartProps) {
  const list = data || [];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-white/5 rounded-2xl p-6 shadow-xs flex flex-col gap-4 select-none h-full min-h-[300px]">
      <h3 className="text-base font-bold text-gray-950 dark:text-white">Top dịch vụ</h3>
      
      <div className="flex-1 w-full relative min-h-[220px]">
        {list.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-400">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={list}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {list.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                formatter={(value: unknown) => [`${Number(value || 0)} xe`, 'Số lượng']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
