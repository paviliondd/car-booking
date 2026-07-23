import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

export default function AdminPageHeader({ title, description, parent, action }: { title: string; description: string; parent?: { href: string; label: string }; action?: { href: string; label: string } }) {
  return <header className="mb-6 border-b border-app-border/40 pb-5 dark:border-app-border/50">
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm font-medium text-content-secondary">
      <Link href="/dashboard" className="flex min-h-11 items-center gap-1 rounded-lg px-2 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Home className="h-3.5 w-3.5" />Tổng quan</Link>
      {parent && <><ChevronRight className="h-3.5 w-3.5" /><Link href={parent.href} className="flex min-h-11 items-center rounded-lg px-2 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{parent.label}</Link></>}
      <ChevronRight className="h-3.5 w-3.5" /><span aria-current="page" className="px-2 text-content-secondary dark:text-content">{title}</span>
    </nav>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>{parent && <Link href={parent.href} className="mb-2 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-semibold text-content-secondary hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><ChevronLeft className="h-4 w-4" />Quay lại {parent.label.toLowerCase()}</Link>}<h1 className="text-2xl font-bold text-content dark:text-content sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-content-secondary dark:text-content-secondary sm:text-base">{description}</p></div>
      {action && <Link href={action.href} className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25">{action.label}</Link>}
    </div>
  </header>;
}
