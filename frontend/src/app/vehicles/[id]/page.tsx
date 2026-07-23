'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Fuel,
  Gauge,
  MapPin,
  Phone,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { api, type Vehicle } from '@/lib/api';
import { rentalPolicies, storeInfo } from '@/lib/store';

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVehicle(await api.vehicles.findOne(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin xe.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) {
    return <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-16 text-center text-slate-600">Đang tải thông tin xe…</main>;
  }
  if (error || !vehicle) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-950">Không thể mở xe này</h1>
        <p className="mt-3 text-slate-600">{error || 'Xe không tồn tại.'}</p>
        <button onClick={() => void load()} className="mt-6 min-h-11 rounded-xl bg-emerald-700 px-5 font-semibold text-white">Thử lại</button>
      </main>
    );
  }

  const images = vehicle.images.filter(Boolean);
  const heroImage = images[activeImage];
  const bookingHref = `/booking?vehicleId=${encodeURIComponent(vehicle.id)}`;

  return (
    <main className="bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/vehicles" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-white">
          <ChevronLeft className="h-4 w-4" /> Quay lại danh sách xe
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[16/9] bg-slate-100">
                {heroImage ? (
                  <Image src={heroImage} alt={`${vehicle.brand} ${vehicle.model}`} fill priority sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Car className="h-20 w-20 text-slate-300" aria-hidden="true" /></div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3 p-4">
                  {images.slice(0, 4).map((src, index) => (
                    <button key={src} onClick={() => setActiveImage(index)} aria-label={`Xem ảnh xe ${index + 1}`} className={`relative aspect-video overflow-hidden rounded-xl border-2 ${activeImage === index ? 'border-emerald-600' : 'border-transparent'}`}>
                      <Image src={src} alt="" fill sizes="180px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Xe tự lái</p>
              <h1 className="mt-2 text-3xl font-bold">{vehicle.brand} {vehicle.model}</h1>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className={`rounded-full px-3 py-1 ${vehicle.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                  {vehicle.status === 'AVAILABLE' ? 'Đang sẵn sàng' : 'Cần kiểm tra lịch'}
                </span>
                <span className={`rounded-full px-3 py-1 ${images.length > 0 ? 'bg-slate-100 text-slate-700' : 'bg-red-50 text-red-700'}`}>
                  {images.length > 0 ? `${images.length} ảnh xe` : 'Thiếu ảnh xe'}
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  [Users, `${vehicle.seats} chỗ`],
                  [Settings2, vehicle.transmission === 'AUTO' ? 'Số tự động' : 'Số sàn'],
                  [Fuel, vehicle.fuel],
                  [CalendarDays, `Đời ${vehicle.year}`],
                ].map(([Icon, label]) => {
                  const ItemIcon = Icon as typeof Users;
                  return <div key={String(label)} className="rounded-2xl bg-slate-50 p-4"><ItemIcon className="h-5 w-5 text-emerald-700" /><p className="mt-2 text-sm font-semibold">{String(label)}</p></div>;
                })}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold">Giá và giới hạn sử dụng</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt>Ngày thường</dt><dd className="font-bold">{money(vehicle.dailyPrice)}/ngày</dd></div>
                  <div className="flex justify-between gap-4"><dt>Cuối tuần</dt><dd className="font-bold">{money(vehicle.weekendPrice)}/ngày</dd></div>
                  <div className="flex justify-between gap-4"><dt>Ngày lễ</dt><dd className="font-bold">{money(vehicle.holidayPrice)}/ngày</dd></div>
                  <div className="flex justify-between gap-4"><dt>Giới hạn</dt><dd className="font-bold">{vehicle.limitKmPerDay ? `${vehicle.limitKmPerDay} km/ngày` : 'Liên hệ'}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Vượt giới hạn</dt><dd className="font-bold">{vehicle.overLimitFee ? `${money(vehicle.overLimitFee)}/km` : 'Liên hệ'}</dd></div>
                </dl>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold">Điểm nhận xe</h2>
                <div className="mt-5 space-y-4 text-sm text-slate-700">
                  <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-emerald-700" />{vehicle.pickupLocation || storeInfo.address}</p>
                  <p className="flex gap-3"><Clock3 className="h-5 w-5 shrink-0 text-emerald-700" />{storeInfo.hours}</p>
                  <a href={`tel:${storeInfo.phone.replace(/\s/g, '')}`} className="flex min-h-11 items-center gap-3 font-semibold text-emerald-800"><Phone className="h-5 w-5" />{storeInfo.phone}</a>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold">Quy định thuê xe</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {rentalPolicies.map((policy) => <div key={policy.title} className="flex gap-3 rounded-2xl bg-slate-50 p-4"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-700" /><div><h3 className="font-bold">{policy.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{policy.description}</p></div></div>)}
              </div>
              {vehicle.terms && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-bold text-amber-950">Quy định riêng của xe</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-900">{vehicle.terms}</p></div>}
            </section>
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-lg lg:sticky lg:top-24">
            <p className="text-sm text-slate-600">Từ</p>
            <p className="mt-1 text-3xl font-bold text-emerald-700">{money(vehicle.dailyPrice)}<span className="text-sm font-medium text-slate-500"> / ngày</span></p>
            <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950"><CheckCircle2 className="h-5 w-5 shrink-0" /><p>Giá cuối cùng được backend tính theo ngày thuê, bảo hiểm và ưu đãi trước khi xác nhận.</p></div>
            <Link href={bookingHref} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
              <Gauge className="h-5 w-5" /> Chọn lịch thuê xe
            </Link>
            <p className="mt-4 text-center text-xs leading-5 text-slate-500">Bạn chưa bị tính phí ở bước này.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
