'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, CalendarClock, Car, Fuel, MapPin, Search, Settings2, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api, type Vehicle } from '@/lib/api';
import { storeInfo } from '@/lib/store';

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const fuelLabel: Record<string, string> = { GASOLINE: 'Xăng', DIESEL: 'Dầu', ELECTRIC: 'Điện' };
const transmissionLabel: Record<string, string> = { AUTO: 'Số tự động', MANUAL: 'Số sàn' };

export default function AvailableVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState('');
  const [seats, setSeats] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVehicles(await api.vehicles.availableNow());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách xe sẵn sàng.');
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
      const matchesSeats = seats === 'ALL' || vehicle.seats === Number(seats);
      return matchesQuery && matchesSeats;
    });
  }, [query, seats, vehicles]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <Header />
      <main className="flex-1">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="inline-flex min-h-8 items-center rounded-full bg-emerald-50 px-3 text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Đồng bộ từ admin
                </p>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Xe sẵn sàng cho thuê</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Danh sách này lấy trực tiếp từ dữ liệu xe admin đang quản lý. Hệ thống chỉ hiển thị xe có trạng thái sẵn sàng, có hình ảnh và không trùng booking tại thời điểm hiện tại.
                </p>
              </div>
              <Link href="/booking" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
                <CalendarClock className="h-4 w-4" />
                Kiểm tra theo lịch thuê
              </Link>
            </div>

            <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_180px]">
              <label className="relative">
                <span className="sr-only">Tìm kiếm xe</span>
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo hãng, dòng xe, biển số hoặc điểm nhận"
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <select
                aria-label="Lọc số chỗ"
                value={seats}
                onChange={(event) => setSeats(event.target.value)}
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="ALL">Tất cả số chỗ</option>
                <option value="4">4 chỗ</option>
                <option value="5">5 chỗ</option>
                <option value="7">7 chỗ</option>
                <option value="9">9 chỗ</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">Đang kiểm tra xe rảnh…</div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Không thể tải dữ liệu xe</p>
                  <p className="mt-1">{error}</p>
                  <button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-lg bg-red-700 px-4 font-bold text-white hover:bg-red-800">Thử lại</button>
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Car className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-xl font-bold">Chưa có xe sẵn sàng để hiển thị</h2>
              <p className="mt-2 text-sm text-slate-600">Admin cần thêm xe, tải ảnh và đặt trạng thái xe là “Sẵn sàng”.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((vehicle) => (
                <article key={vehicle.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <Link href={`/vehicles/${vehicle.id}`} className="block">
                    <div className="relative aspect-[16/10] bg-slate-100">
                      {vehicle.images[0] ? (
                        <Image src={vehicle.images[0]} alt={`${vehicle.brand} ${vehicle.model}`} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Car className="h-14 w-14 text-slate-300" /></div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Sẵn sàng</span>
                    </div>
                  </Link>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{vehicle.brand}</p>
                        <h2 className="mt-1 text-xl font-black">{vehicle.model}</h2>
                        <p className="mt-1 text-xs text-slate-500">{vehicle.plateNumber}</p>
                      </div>
                      <p className="text-right text-lg font-black text-emerald-700">{money(vehicle.dailyPrice)}<span className="block text-xs font-medium text-slate-500">/ ngày</span></p>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                      <span className="rounded-lg bg-slate-50 p-2 font-semibold text-slate-700"><Users className="mb-1 h-4 w-4 text-emerald-700" />{vehicle.seats} chỗ</span>
                      <span className="rounded-lg bg-slate-50 p-2 font-semibold text-slate-700"><Settings2 className="mb-1 h-4 w-4 text-emerald-700" />{transmissionLabel[vehicle.transmission] || vehicle.transmission}</span>
                      <span className="rounded-lg bg-slate-50 p-2 font-semibold text-slate-700"><Fuel className="mb-1 h-4 w-4 text-emerald-700" />{fuelLabel[vehicle.fuel] || vehicle.fuel}</span>
                    </div>
                    <p className="mt-4 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{storeInfo.address}</p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Link href={`/vehicles/${vehicle.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Giới thiệu xe</Link>
                      <Link href={`/booking?vehicleId=${vehicle.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white hover:bg-emerald-800">Thuê xe này</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
