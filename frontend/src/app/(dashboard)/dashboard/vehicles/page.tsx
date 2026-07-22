'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { api, type Vehicle } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import AdminPageHeader from '@/components/dashboard/AdminPageHeader';
import { AdminEmpty, AdminError, AdminLoading } from '@/components/dashboard/AdminState';

const statusLabels: Record<string, string> = { AVAILABLE: 'Sẵn sàng', RENTED: 'Đang thuê', MAINTENANCE: 'Bảo dưỡng', LOCKED: 'Đã khóa' };

function AdminVehiclesContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setVehicles(await api.vehicles.findAll()); } catch (err) { setError(err instanceof Error ? err.message : 'Không thể tải đội xe.'); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const filtered = useMemo(() => vehicles.filter((vehicle) => `${vehicle.brand} ${vehicle.model} ${vehicle.plateNumber}`.toLowerCase().includes(query.toLowerCase()) && (status === 'ALL' || vehicle.status === status)), [query, status, vehicles]);
  const updateStatus = async (vehicle: Vehicle, nextStatus: string) => { if (!window.confirm(`Xác nhận chuyển ${vehicle.plateNumber} sang “${statusLabels[nextStatus]}”?`)) return; setBusyId(vehicle.id); try { const updated = await api.vehicles.updateStatus(vehicle.id, nextStatus); setVehicles((items) => items.map((item) => item.id === updated.id ? updated : item)); toast.success('Đã cập nhật trạng thái xe.'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Không thể cập nhật xe.'); } finally { setBusyId(''); } };
  return <div><AdminPageHeader title="Quản lý đội xe" description="Tra cứu và cập nhật trạng thái phương tiện trên toàn hệ thống." action={{ href: '/dashboard/vehicles/new', label: 'Thêm xe mới' }} />
    <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1fr_220px]">
      <label className="relative"><span className="sr-only">Tìm xe</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo hãng, mẫu hoặc biển số" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100" /></label>
      <label><span className="sr-only">Lọc trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {loading ? <AdminLoading /> : error ? <AdminError message={error} onRetry={() => void load()} /> : filtered.length === 0 ? <AdminEmpty message="Không có xe phù hợp với bộ lọc." /> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr><th className="p-4">Phương tiện</th><th className="p-4">Chủ xe</th><th className="p-4">Giá/ngày</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{filtered.map((vehicle) => <tr key={vehicle.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-4"><p className="font-bold text-slate-900 dark:text-white">{vehicle.brand} {vehicle.model}</p><p className="text-xs text-slate-500">{vehicle.plateNumber}</p></td><td className="p-4 text-slate-600 dark:text-slate-300">{vehicle.owner?.name || 'Xe hệ thống'}</td><td className="p-4 font-semibold">{vehicle.dailyPrice.toLocaleString('vi-VN')} đ</td><td className="p-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{statusLabels[vehicle.status] || vehicle.status}</span></td><td className="p-4"><div className="flex justify-end gap-2"><Link href={`/dashboard/vehicles/${vehicle.id}`} className="inline-flex min-h-11 items-center rounded-lg px-3 font-bold text-emerald-700 hover:bg-emerald-50">Chi tiết</Link><select aria-label={`Đổi trạng thái ${vehicle.plateNumber}`} disabled={busyId === vehicle.id || vehicle.status === 'RENTED'} value={vehicle.status} onChange={(event) => void updateStatus(vehicle, event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-2 disabled:cursor-not-allowed disabled:opacity-50">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></td></tr>)}</tbody></table></div>}
  </div>;
}

export default function AdminVehiclesPage() { return <Suspense fallback={<AdminLoading />}><AdminVehiclesContent /></Suspense>; }
