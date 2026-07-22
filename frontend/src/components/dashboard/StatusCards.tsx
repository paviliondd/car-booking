'use client';

import React from 'react';
import { Compass, Car, Key, Flag, AlertTriangle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatusCounts {
  waitConfirm: number;
  confirmed: number;
  received: number;
  returned: number;
  accident: number;
  pledged: number;
}

interface StatusCardsProps {
  counts: StatusCounts | null;
}

export default function StatusCards({ counts }: StatusCardsProps) {
  const router = useRouter();

  const statusList = [
    { 
      key: 'waitConfirm', 
      label: 'Chờ xác nhận', 
      count: counts?.waitConfirm ?? 0, 
      icon: <Compass className="h-6 w-6 text-green-500 animate-spin-slow" />,
      colorClass: 'border-green-150 hover:bg-green-50/10', href: '/dashboard/bookings?status=PENDING'
    },
    { 
      key: 'confirmed', 
      label: 'Đã xác nhận', 
      count: counts?.confirmed ?? 0, 
      icon: <Car className="h-6 w-6 text-[#3699FF]" />,
      colorClass: 'border-blue-150 hover:bg-blue-50/10', href: '/dashboard/bookings?status=CONFIRMED'
    },
    { 
      key: 'received', 
      label: 'Đã nhận xe', 
      count: counts?.received ?? 0, 
      icon: <Key className="h-6 w-6 text-amber-500" />,
      colorClass: 'border-amber-150 hover:bg-amber-50/10', href: '/dashboard/bookings?status=RENTING'
    },
    { 
      key: 'returned', 
      label: 'Đã trả xe', 
      count: counts?.returned ?? 0, 
      icon: <Flag className="h-6 w-6 text-[#008F5A]" />,
      colorClass: 'border-emerald-150 hover:bg-emerald-50/10', href: '/dashboard/bookings?status=COMPLETED'
    },
    { 
      key: 'accident', 
      label: 'Xe bảo dưỡng',
      count: counts?.accident ?? 0, 
      icon: <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse" />,
      colorClass: 'border-red-150 hover:bg-red-50/10', href: '/dashboard/maintenance'
    },
    { 
      key: 'pledged', 
      label: 'Xe đã khóa',
      count: counts?.pledged ?? 0, 
      icon: <Lock className="h-6 w-6 text-emerald-500" />,
      colorClass: 'border-purple-150 hover:bg-purple-50/10', href: '/dashboard/vehicles?status=LOCKED'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      {statusList.map((status) => (
        <button type="button"
          key={status.key}
          onClick={() => router.push(status.href)}
          className={`flex min-h-20 items-center gap-4 bg-white text-left dark:bg-gray-900 border border-gray-150 dark:border-white/5 p-4 rounded-xl shadow-xs transition duration-200 cursor-pointer hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${status.colorClass}`}
        >
          <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg flex-shrink-0">
            {status.icon}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xl md:text-2xl font-black text-gray-900 dark:text-white truncate">
              {status.count}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-bold tracking-tight leading-tight truncate">
              {status.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
