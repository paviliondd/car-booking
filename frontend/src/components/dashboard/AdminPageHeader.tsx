import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

export default function AdminPageHeader({ title, description, parent, action }: { title: string; description: string; parent?: { href: string; label: string }; action?: { href: string; label: string } }) {
  return <header className="mb-6 border-b border-slate-200 pb-5 dark:border-slate-800">
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm font-medium text-slate-500">
      <Link href="/dashboard" className="flex min-h-11 items-center gap-1 rounded-lg px-2 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Home className="h-3.5 w-3.5" />Tổng quan</Link>
      {parent && <><ChevronRight className="h-3.5 w-3.5" /><Link href={parent.href} className="flex min-h-11 items-center rounded-lg px-2 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">{parent.label}</Link></>}
      <ChevronRight className="h-3.5 w-3.5" /><span aria-current="page" className="px-2 text-slate-700 dark:text-slate-200">{title}</span>
    </nav>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>{parent && <Link href={parent.href} className="mb-2 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-semibold text-slate-600 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><ChevronLeft className="h-4 w-4" />Quay lại {parent.label.toLowerCase()}</Link>}<h1 className="text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">{description}</p></div>
      {action && <Link href={action.href} className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">{action.label}</Link>}
    </div>
  </header>;
}
