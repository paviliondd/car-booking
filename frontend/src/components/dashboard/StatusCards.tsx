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
      icon: <Compass className="h-6 w-6 text-amber-600" />,
      colorClass: 'hover:bg-amber-50/70 dark:hover:bg-amber-950/20', href: '/dashboard/bookings?status=PENDING'
    },
    { 
      key: 'confirmed', 
      label: 'Đã xác nhận', 
      count: counts?.confirmed ?? 0, 
      icon: <Car className="h-6 w-6 text-sky-700 dark:text-sky-400" />,
      colorClass: 'hover:bg-sky-50/70 dark:hover:bg-sky-950/20', href: '/dashboard/bookings?status=CONFIRMED'
    },
    { 
      key: 'received', 
      label: 'Đã nhận xe', 
      count: counts?.received ?? 0, 
      icon: <Key className="h-6 w-6 text-amber-500" />,
      colorClass: 'hover:bg-amber-50/70 dark:hover:bg-amber-950/20', href: '/dashboard/bookings?status=RENTING'
    },
    { 
      key: 'returned', 
      label: 'Đã trả xe', 
      count: counts?.returned ?? 0, 
      icon: <Flag className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />,
      colorClass: 'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/20', href: '/dashboard/bookings?status=COMPLETED'
    },
    { 
      key: 'accident', 
      label: 'Xe bảo dưỡng',
      count: counts?.accident ?? 0, 
      icon: <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse" />,
      colorClass: 'hover:bg-red-50/70 dark:hover:bg-red-950/20', href: '/dashboard/maintenance'
    },
    { 
      key: 'pledged', 
      label: 'Xe đã khóa',
      count: counts?.pledged ?? 0, 
      icon: <Lock className="h-6 w-6 text-slate-600 dark:text-slate-300" />,
      colorClass: 'hover:bg-slate-50 dark:hover:bg-slate-800', href: '/dashboard/vehicles?status=LOCKED'
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {statusList.map((status) => (
        <button type="button"
          key={status.key}
          onClick={() => router.push(status.href)}
          className={`flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${status.colorClass}`}
        >
          <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg flex-shrink-0">
            {status.icon}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
              {status.count}
            </span>
            <span className="text-sm font-medium leading-5 text-slate-600 dark:text-slate-400">
              {status.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
