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
      icon: <Compass className="h-6 w-6 text-warning" />,
      colorClass: 'hover:bg-warning-muted/70 dark:hover:bg-warning-muted/70', href: '/dashboard/bookings?status=PENDING'
    },
    { 
      key: 'confirmed', 
      label: 'Đã xác nhận', 
      count: counts?.confirmed ?? 0, 
      icon: <Car className="h-6 w-6 text-info dark:text-info" />,
      colorClass: 'hover:bg-info-muted/70 dark:hover:bg-info-muted/70', href: '/dashboard/bookings?status=CONFIRMED'
    },
    { 
      key: 'received', 
      label: 'Đã nhận xe', 
      count: counts?.received ?? 0, 
      icon: <Key className="h-6 w-6 text-warning" />,
      colorClass: 'hover:bg-warning-muted/70 dark:hover:bg-warning-muted/70', href: '/dashboard/bookings?status=RENTING'
    },
    { 
      key: 'returned', 
      label: 'Đã trả xe', 
      count: counts?.returned ?? 0, 
      icon: <Flag className="h-6 w-6 text-brand dark:text-brand" />,
      colorClass: 'hover:bg-utility/70 dark:hover:bg-utility/70', href: '/dashboard/bookings?status=COMPLETED'
    },
    { 
      key: 'accident', 
      label: 'Xe bảo dưỡng',
      count: counts?.accident ?? 0, 
      icon: <AlertTriangle className="h-6 w-6 text-danger animate-pulse" />,
      colorClass: 'hover:bg-danger-muted/70 dark:hover:bg-danger-muted/70', href: '/dashboard/maintenance'
    },
    { 
      key: 'pledged', 
      label: 'Xe đã khóa',
      count: counts?.pledged ?? 0, 
      icon: <Lock className="h-6 w-6 text-content-secondary dark:text-content-secondary" />,
      colorClass: 'hover:bg-app-muted dark:hover:bg-app-muted', href: '/dashboard/vehicles?status=LOCKED'
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {statusList.map((status) => (
        <button type="button"
          key={status.key}
          onClick={() => router.push(status.href)}
          className={`flex min-h-24 items-center gap-3 rounded-xl border border-app-border/40 bg-app-surface p-4 text-left shadow-sm transition duration-200 hover:border-brand dark:border-app-border/50 dark:bg-app-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${status.colorClass}`}
        >
          <div className="p-2.5 bg-app-muted dark:bg-app-surface/5 rounded-lg flex-shrink-0">
            {status.icon}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-2xl font-bold tabular-nums text-content dark:text-content">
              {status.count}
            </span>
            <span className="text-sm font-medium leading-5 text-content-secondary dark:text-content-secondary">
              {status.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
