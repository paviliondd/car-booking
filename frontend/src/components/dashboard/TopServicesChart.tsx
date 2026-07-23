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

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

export default function TopServicesChart({ data }: TopServicesChartProps) {
  const list = data || [];

  return (
    <div className="bg-app-surface border border-app-border/40 rounded-2xl p-6 shadow-xs flex flex-col gap-4 h-full min-h-[300px]">
      <h3 className="text-base font-bold text-content">Cơ cấu nhiên liệu</h3>
      
      <div className="flex-1 w-full relative min-h-[220px]">
        {list.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-content-secondary">
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
                contentStyle={{ background: 'var(--color-tooltip-bg)', border: 'none', borderRadius: '8px', color: 'var(--color-tooltip-fg)', fontSize: '11px' }}
                formatter={(value: unknown) => [`${Number(value || 0)} xe`, 'Số lượng']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
