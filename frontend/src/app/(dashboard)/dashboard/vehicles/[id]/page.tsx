'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api, type Vehicle } from '@/lib/api';
import AdminPageHeader from '@/components/dashboard/AdminPageHeader';
import { AdminError, AdminLoading } from '@/components/dashboard/AdminState';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setVehicle(await api.vehicles.findOne(id)); } catch (err) { setError(err instanceof Error ? err.message : 'Không thể tải xe.'); } finally { setLoading(false); } }, [id]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (loading) return <AdminLoading />; if (error || !vehicle) return <AdminError message={error || 'Không tìm thấy xe.'} onRetry={() => void load()} />;
  const fields = [['Biển số', vehicle.plateNumber], ['Năm sản xuất', vehicle.year], ['Số chỗ', vehicle.seats], ['Hộp số', vehicle.transmission], ['Nhiên liệu', vehicle.fuel], ['Màu sắc', vehicle.color], ['Địa điểm nhận xe', vehicle.pickupLocation], ['Giá ngày thường', `${vehicle.dailyPrice.toLocaleString('vi-VN')} đ`]];
  return <div><AdminPageHeader title={`${vehicle.brand} ${vehicle.model}`} description="Thông tin phương tiện và dữ liệu vận hành liên quan." parent={{ href: '/dashboard/vehicles', label: 'Đội xe' }} />
    <div className="mb-5 flex justify-end"><Link href={`/dashboard/vehicles/${vehicle.id}/edit`} className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 font-bold text-white hover:bg-emerald-800">Chỉnh sửa xe</Link></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">Thông tin xe</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{String(value || 'Chưa cập nhật')}</dd></div>)}</dl></section>
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">Hình ảnh</h2><div className="mt-4 grid gap-3">{vehicle.images.length ? vehicle.images.map((src, index) => <div key={src} className="relative aspect-video overflow-hidden rounded-xl bg-slate-100"><Image src={src} alt={`${vehicle.brand} ${vehicle.model} - ảnh ${index + 1}`} fill className="object-cover" sizes="360px" /></div>) : <p className="text-sm text-slate-500">Xe chưa có hình ảnh.</p>}</div></aside></div>
  </div>;
}
