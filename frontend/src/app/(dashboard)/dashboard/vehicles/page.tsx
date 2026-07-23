'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Car, Edit3, Eye, Search, Trash2 } from 'lucide-react';
import { api, type Vehicle } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import AdminPageHeader from '@/components/dashboard/AdminPageHeader';
import { AdminEmpty, AdminError, AdminLoading } from '@/components/dashboard/AdminState';

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  RENTED: 'Đang thuê',
  MAINTENANCE: 'Bảo dưỡng',
  LOCKED: 'Đã khóa',
};

const statusTone: Record<string, string> = {
  AVAILABLE: 'bg-utility text-utility-foreground ring-brand/25',
  RENTED: 'bg-info-muted text-info ring-info/25',
  MAINTENANCE: 'bg-warning-muted text-warning ring-warning/25',
  LOCKED: 'bg-app-muted text-content-secondary ring-app-border/40',
};

const nextStatuses = ['AVAILABLE', 'MAINTENANCE', 'LOCKED'];

function AdminVehiclesContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVehicles(await api.vehicles.findAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải đội xe.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesQuery = `${vehicle.brand} ${vehicle.model} ${vehicle.plateNumber} ${vehicle.pickupLocation || ''}`.toLowerCase().includes(normalized);
      const matchesStatus = status === 'ALL' || vehicle.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, vehicles]);

  const updateStatus = async (vehicle: Vehicle, nextStatus: string) => {
    if (vehicle.status === nextStatus) return;
    if (!window.confirm(`Xác nhận chuyển ${vehicle.plateNumber} sang "${statusLabels[nextStatus]}"?`)) return;
    setBusyId(vehicle.id);
    try {
      const updated = await api.vehicles.updateStatus(vehicle.id, nextStatus);
      setVehicles((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Đã cập nhật trạng thái xe.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật xe.');
    } finally {
      setBusyId('');
    }
  };

  const deleteVehicle = async (vehicle: Vehicle) => {
    if (!window.confirm(`Xóa xe ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})?`)) return;
    setBusyId(vehicle.id);
    try {
      await api.vehicles.delete(vehicle.id);
      setVehicles((items) => items.filter((item) => item.id !== vehicle.id));
      toast.success('Đã xóa xe khỏi hệ thống.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa xe.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Quản lý đội xe"
        description="Admin cập nhật xe tại đây; trang chủ và trang xe sẵn sàng dùng cùng nguồn dữ liệu này."
        action={{ href: '/dashboard/vehicles/new', label: 'Thêm xe mới' }}
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-app-border/40 bg-app-surface p-4 dark:border-app-border/50 dark:bg-app-surface sm:grid-cols-[1fr_220px]">
        <label className="relative">
          <span className="sr-only">Tìm xe</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-content-secondary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo hãng, mẫu, biển số, điểm nhận"
            className="min-h-11 w-full rounded-lg border border-app-border bg-app-surface pl-10 pr-3 text-sm text-content outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20 dark:border-app-border/70 dark:bg-app-surface dark:text-content"
          />
        </label>
        <label>
          <span className="sr-only">Lọc trạng thái</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-app-border bg-app-surface px-3 text-sm text-content outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20 dark:border-app-border/70 dark:bg-app-surface dark:text-content"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {loading ? <AdminLoading /> : error ? <AdminError message={error} onRetry={() => void load()} /> : filtered.length === 0 ? <AdminEmpty message="Không có xe phù hợp với bộ lọc." /> : (
        <div className="overflow-hidden rounded-xl border border-app-border/40 bg-app-surface dark:border-app-border/50 dark:bg-app-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-app-muted text-xs uppercase text-content-secondary dark:bg-app-muted dark:text-content-secondary">
                <tr>
                  <th className="p-4">Phương tiện</th>
                  <th className="p-4">Thông tin thuê</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Cập nhật nhanh</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-app-border/30 align-top dark:border-app-border/50">
                    <td className="p-4">
                      <div className="flex gap-3">
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-app-muted ring-1 ring-app-border/40 dark:bg-app-muted dark:ring-app-border/70">
                          {vehicle.images[0] ? <Image src={vehicle.images[0]} alt={`${vehicle.brand} ${vehicle.model}`} fill sizes="96px" className="object-cover" /> : <div className="flex h-full items-center justify-center"><Car className="h-6 w-6 text-content-secondary" /></div>}
                        </div>
                        <div>
                          <p className="font-black text-content dark:text-content">{vehicle.brand} {vehicle.model}</p>
                          <p className="mt-1 text-xs text-content-secondary">{vehicle.plateNumber} · {vehicle.year} · {vehicle.seats} chỗ</p>
                          <p className="mt-1 text-xs text-content-secondary">{vehicle.owner?.name || 'Xe hệ thống'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-content-secondary dark:text-content-secondary">
                      <p className="font-bold">{vehicle.dailyPrice.toLocaleString('vi-VN')} đ/ngày</p>
                      <p className="mt-1 text-xs text-content-secondary">{vehicle.pickupLocation || 'Chưa cập nhật điểm nhận'}</p>
                      <p className={`mt-1 text-xs font-semibold ${vehicle.images.length > 0 ? 'text-brand' : 'text-danger'}`}>{vehicle.images.length > 0 ? `${vehicle.images.length} ảnh` : 'Thiếu ảnh xe'}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone[vehicle.status] || statusTone.LOCKED}`}>
                        {statusLabels[vehicle.status] || vehicle.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {vehicle.status === 'RENTED' ? (
                        <p className="max-w-56 text-xs leading-5 text-content-secondary">Xe đang thuê được cập nhật theo vòng đời đơn thuê, không đổi thủ công tại bảng.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {nextStatuses.map((nextStatus) => (
                            <button
                              key={nextStatus}
                              type="button"
                              disabled={busyId === vehicle.id || vehicle.status === nextStatus}
                              onClick={() => void updateStatus(vehicle, nextStatus)}
                              className={`min-h-10 rounded-lg border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                vehicle.status === nextStatus
                                  ? 'border-brand bg-utility text-brand'
                                  : 'border-app-border bg-app-surface text-content-secondary hover:bg-app-muted dark:border-app-border/70 dark:bg-app-surface dark:text-content dark:hover:bg-app-muted'
                              }`}
                            >
                              {statusLabels[nextStatus]}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/vehicles/${vehicle.id}`} aria-label="Xem chi tiết xe" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-brand hover:bg-utility dark:hover:bg-utility"><Eye className="h-4 w-4" /></Link>
                        <Link href={`/dashboard/vehicles/${vehicle.id}/edit`} aria-label="Chỉnh sửa xe" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-content-secondary hover:bg-app-muted dark:text-content dark:hover:bg-app-muted"><Edit3 className="h-4 w-4" /></Link>
                        <button type="button" disabled={busyId === vehicle.id || vehicle.status === 'RENTED'} onClick={() => void deleteVehicle(vehicle)} aria-label="Xóa xe" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-danger hover:bg-danger-muted disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-danger-muted"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVehiclesPage() {
  return <Suspense fallback={<AdminLoading />}><AdminVehiclesContent /></Suspense>;
}
