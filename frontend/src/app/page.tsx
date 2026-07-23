'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, CalendarClock, Car, ChevronRight, Clock, Fuel, HelpCircle, MapPin, Phone, ShieldCheck, Users } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VehicleDetailModal from '@/components/vehicles/VehicleDetailModal';
import { api, type Vehicle } from '@/lib/api';
import { storeInfo } from '@/lib/store';
import { vehicleFuelLabel, vehicleTransmissionLabel } from '@/lib/vehicle-labels';

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const faqs = [
  {
    q: 'Thủ tục thuê xe tự lái cần những giấy tờ gì?',
    a: 'Bạn cần tài khoản đã đăng nhập, CCCD, giấy phép lái xe còn hạn và thông tin liên hệ chính xác để hệ thống tạo hồ sơ thuê xe.',
  },
  {
    q: 'Hệ thống kiểm tra xe rảnh như thế nào?',
    a: 'Danh sách chỉ hiển thị những xe đang sẵn sàng và không trùng với thời gian bạn muốn thuê.',
  },
  {
    q: 'Giá thuê cuối cùng được tính ở đâu?',
    a: 'Giá được tính theo ngày thường, cuối tuần, ngày lễ, bảo hiểm và ưu đãi. Bạn sẽ thấy đầy đủ báo giá trước khi xác nhận đơn.',
  },
];

export default function HomePage() {
  const [featuredCars, setFeaturedCars] = useState<Vehicle[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const loadFeaturedCars = useCallback(async () => {
    setLoadingCars(true);
    try {
      const cars = await api.vehicles.availableNow();
      setFeaturedCars(cars.slice(0, 3));
    } catch {
      setFeaturedCars([]);
    } finally {
      setLoadingCars(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFeaturedCars(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFeaturedCars]);

  return (
    <div className="flex min-h-screen flex-col bg-app-muted text-content">
      <Header />
      <main>
        <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px]">
            <div className="flex flex-col gap-6">
              <p className="inline-flex w-fit min-h-8 items-center gap-2 rounded-full border border-brand/30 bg-utility px-3 text-xs font-bold uppercase tracking-wide text-brand">
                <Award className="h-4 w-4" />
                Thuê xe tự lái tại La Gi · Phục vụ 24/7
              </p>
              <div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Chọn xe thật, kiểm tra lịch thật, đặt thuê rõ ràng.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-content-secondary">
                  Dễ dàng xem thông tin xe, hình ảnh, giá thuê, điểm nhận xe và kiểm tra lịch trống trước khi đặt cọc.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/vehicles" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-base font-bold text-on-brand transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25">
                  Xem xe sẵn sàng
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link href="/booking" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface px-6 text-base font-bold text-content transition hover:bg-app-muted">
                  <CalendarClock className="h-5 w-5" />
                  Kiểm tra theo lịch
                </Link>
              </div>
            </div>

            <div className="relative min-h-[340px] overflow-hidden rounded-xl border border-app-border/35 bg-app-muted shadow-sm">
              <Image
                src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
                alt="Xe tự lái tại showroom"
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <SearchBar />
        </section>

        <section id="featured" className="border-y border-app-border/35 bg-app-surface py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-black">Xe đang sẵn sàng cho thuê</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-content-secondary">
                  Chọn xe phù hợp, xem đầy đủ thông tin và kiểm tra lịch thuê ngay trên từng xe.
                </p>
              </div>
              <Link href="/vehicles" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-app-border px-4 text-sm font-bold text-content-secondary hover:bg-app-muted">
                Xem toàn bộ xe
              </Link>
            </div>

            {loadingCars ? (
              <div className="mt-8 rounded-xl border border-app-border/35 bg-app-muted p-8 text-center text-sm text-content-secondary">Đang cập nhật danh sách xe…</div>
            ) : featuredCars.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-app-border bg-app-muted p-8 text-center">
                <Car className="mx-auto h-10 w-10 text-content-secondary" />
                <h3 className="mt-4 text-lg font-bold">Hiện chưa có xe sẵn sàng</h3>
                <p className="mt-2 text-sm text-content-secondary">Vui lòng quay lại sau hoặc chọn lịch thuê để kiểm tra xe phù hợp.</p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {featuredCars.map((car) => (
                  <article key={car.id} className="overflow-hidden rounded-xl border border-app-border/35 bg-app-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicle(car)}
                      aria-label={`Xem thông tin ${car.brand} ${car.model}`}
                      className="block w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
                    >
                      <div className="relative aspect-[16/10] bg-app-muted">
                        {car.images[0] ? (
                          <Image src={car.images[0]} alt={`${car.brand} ${car.model}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><Car className="h-12 w-12 text-content-secondary" /></div>
                        )}
                        <span className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-bold text-on-brand">Sẵn sàng</span>
                      </div>
                    </button>
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-content-secondary">{car.brand}</p>
                      <h3 className="mt-1 text-xl font-black">{car.model}</h3>
                      <p className="mt-3 text-lg font-black text-rental-price">{money(car.dailyPrice)}<span className="text-xs font-medium text-content-secondary"> / ngày</span></p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold text-content-secondary">
                        <span className="rounded-lg bg-app-muted p-2"><Users className="mb-1 h-4 w-4 text-brand" />{car.seats} chỗ</span>
                        <span className="rounded-lg bg-app-muted p-2"><Fuel className="mb-1 h-4 w-4 text-brand" />{vehicleFuelLabel(car.fuel)}</span>
                        <span className="rounded-lg bg-app-muted p-2"><Car className="mb-1 h-4 w-4 text-brand" />{vehicleTransmissionLabel(car.transmission)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedVehicle(car)}
                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-bold text-on-brand hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
                      >
                        Xem thông tin xe
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="showroom" className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="flex items-center gap-2 text-3xl font-black"><MapPin className="h-7 w-7 text-brand" />Showroom và hỗ trợ</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-content-secondary">
              <p className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" /><span><strong>Địa chỉ:</strong> {storeInfo.address}</span></p>
              <p className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand" /><span><strong>Hotline:</strong> 1900 8888</span></p>
              <p className="flex gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" /><span><strong>Giờ làm việc:</strong> {storeInfo.hours}</span></p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-app-border/35 bg-app-surface">
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(storeInfo.address)}&z=17&output=embed`}
              width="100%"
              height="320"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Bản đồ showroom datxe"
            />
          </div>
        </section>

        <section id="policy" className="border-y border-app-border/35 bg-app-surface py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="flex items-center justify-center gap-2 text-center text-3xl font-black"><ShieldCheck className="h-7 w-7 text-brand" />Quy trình thuê xe</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {['Chọn lịch thuê', 'Kiểm tra xe rảnh', 'Đặt cọc và gửi hồ sơ', 'Nhận xe và ký hợp đồng'].map((item, index) => (
                <div key={item} className="rounded-xl border border-app-border/35 bg-app-muted p-5 text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand font-black text-on-brand">{index + 1}</span>
                  <h3 className="mt-4 font-bold">{item}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="flex items-center justify-center gap-2 text-center text-3xl font-black"><HelpCircle className="h-7 w-7 text-brand" />Câu hỏi thường gặp</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="overflow-hidden rounded-xl border border-app-border/35 bg-app-surface">
                <button type="button" onClick={() => setFaqOpen(faqOpen === index ? null : index)} className="flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left font-bold hover:bg-app-muted">
                  <span>{faq.q}</span>
                  <span className="text-xl text-brand">{faqOpen === index ? '-' : '+'}</span>
                </button>
                {faqOpen === index && <p className="border-t border-app-border/35 px-5 py-4 text-sm leading-6 text-content-secondary">{faq.a}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          dates={{}}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}
