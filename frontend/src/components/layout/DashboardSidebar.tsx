'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  MessageSquareText,
  PlusCircle,
  Search,
} from 'lucide-react';

const navigation = [
  { href: '/dashboard', label: 'Tổng quan vận hành', icon: LayoutDashboard },
  { href: '/owner', label: 'Xe và đơn thuê', icon: Car },
  { href: '/owner/add-car', label: 'Thêm xe mới', icon: PlusCircle },
  { href: '/track', label: 'Tra cứu đơn', icon: Search },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <aside className={`z-30 flex min-h-dvh shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-300 transition-[width] duration-200 ${isMinimized ? 'w-[76px]' : 'w-[248px]'}`}>
      <div className="flex h-[68px] items-center justify-between border-b border-slate-800 px-4">
        {!isMinimized && (
          <Link href="/dashboard" className="flex min-h-11 items-center gap-2 rounded-xl font-bold text-white">
            <span className="rounded-lg bg-emerald-600 px-2 py-1 text-sm">datxe</span>
            <span className="text-xs tracking-wider text-slate-400">OPS</span>
          </Link>
        )}
        <button type="button" onClick={() => setIsMinimized((value) => !value)} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white" aria-label={isMinimized ? 'Mở rộng menu' : 'Thu gọn menu'}>
          {isMinimized ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-3" aria-label="Điều hướng quản trị">
        {!isMinimized && <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Vận hành</p>}
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined} title={isMinimized ? label : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Icon className="h-5 w-5 shrink-0" />
              {!isMinimized && <span>{label}</span>}
            </Link>
          );
        })}

        {!isMinimized && (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <MessageSquareText className="h-5 w-5 text-emerald-400" />
            <p className="mt-3 text-sm font-bold text-white">Cần thêm phân hệ?</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Các mục CRM, tài chính và bảo dưỡng sẽ chỉ xuất hiện khi có màn hình hoạt động thật.</p>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <Link href="/" title={isMinimized ? 'Về website' : undefined} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white">
          <ExternalLink className="h-5 w-5 shrink-0" />
          {!isMinimized && <span>Về website</span>}
        </Link>
      </div>
    </aside>
  );
}
