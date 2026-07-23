'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3, BookOpenCheck, Car, ChevronLeft, ChevronRight, ClipboardList,
  ExternalLink, LayoutDashboard, LifeBuoy, Settings2, Users,
} from 'lucide-react';
import type { AuthUser } from '@/lib/api';

const navigation = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/dashboard/bookings', label: 'Đơn thuê', icon: BookOpenCheck },
  { href: '/dashboard/vehicles', label: 'Đội xe', icon: Car },
  { href: '/dashboard/customers', label: 'Khách hàng', icon: Users },
  { href: '/dashboard/maintenance', label: 'Bảo dưỡng', icon: Settings2 },
  { href: '/dashboard/finance', label: 'Tài chính', icon: BarChart3 },
  { href: '/dashboard/tickets', label: 'Hỗ trợ', icon: LifeBuoy },
  { href: '/dashboard/audit', label: 'Nhật ký hệ thống', icon: ClipboardList, adminOnly: true },
];

export default function DashboardSidebar({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <aside className={`z-30 flex min-h-dvh shrink-0 flex-col border-r border-night-border bg-night-surface text-night-secondary transition-[width] duration-200 ${isMinimized ? 'w-[76px]' : 'w-[248px]'}`}>
      <div className="flex h-[68px] items-center justify-between border-b border-night-border px-4">
        {!isMinimized && <Link href="/dashboard" onClick={onNavigate} className="flex min-h-11 items-center gap-2 rounded-xl font-bold text-on-brand"><span className="rounded-lg bg-brand px-2 py-1 text-sm text-on-brand">datxe</span><span className="text-xs tracking-wider text-night-secondary">ADMIN</span></Link>}
        <button type="button" onClick={() => setIsMinimized((value) => !value)} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-night-secondary transition hover:bg-night-muted hover:text-night-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-night-accent" aria-label={isMinimized ? 'Mở rộng menu' : 'Thu gọn menu'}>
          {isMinimized ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3" aria-label="Điều hướng quản trị">
        {!isMinimized && <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-night-secondary">Vận hành</p>}
        {navigation.filter((item) => !item.adminOnly || user.role === 'ADMIN').map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} title={isMinimized ? label : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-night-accent ${active ? 'bg-night-muted text-night-accent ring-1 ring-night-accent/40' : 'text-night-secondary hover:bg-night-muted hover:text-night-content'}`}><Icon className="h-5 w-5 shrink-0" />{!isMinimized && <span>{label}</span>}</Link>;
        })}
      </nav>
      <div className="border-t border-night-border p-3"><Link href="/" onClick={onNavigate} title={isMinimized ? 'Về website' : undefined} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-night-secondary transition hover:bg-night-muted hover:text-night-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-night-accent"><ExternalLink className="h-5 w-5 shrink-0" />{!isMinimized && <span>Về website</span>}</Link></div>
    </aside>
  );
}
