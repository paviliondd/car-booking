'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, CalendarClock, Car, ChevronRight, Clock, Fuel, HelpCircle, MapPin, Phone, ShieldCheck, Users } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api, type Vehicle } from '@/lib/api';
import { storeInfo } from '@/lib/store';

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const fuelLabel: Record<string, string> = { GASOLINE: 'Xăng', DIESEL: 'Dầu', ELECTRIC: 'Điện' };
const transmissionLabel: Record<string, string> = { AUTO: 'Số tự động', MANUAL: 'Số sàn' };

const faqs = [
  {
    q: 'Thủ tục thuê xe tự lái cần những giấy tờ gì?',
    a: 'Bạn cần tài khoản đã đăng nhập, CCCD, giấy phép lái xe còn hạn và thông tin liên hệ chính xác để hệ thống tạo hồ sơ thuê xe.',
  },
  {
    q: 'Hệ thống kiểm tra xe rảnh như thế nào?',
    a: 'Xe chỉ được hiển thị khi admin đặt trạng thái Sẵn sàng, xe có hình ảnh cơ bản và không có booking đang phủ khoảng thời gian khách muốn thuê.',
  },
  {
    q: 'Giá thuê cuối cùng được tính ở đâu?',
    a: 'Backend tính giá theo ngày thường, cuối tuần, ngày lễ, bảo hiểm, đặt cọc và mã giảm giá trước khi khách xác nhận đơn.',
  },
];

export default function HomePage() {
  const [featuredCars, setFeaturedCars] = useState<Vehicle[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <Header />
      <main>
        <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px]">
            <div className="flex flex-col gap-6">
              <p className="inline-flex w-fit min-h-8 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <Award className="h-4 w-4" />
                Nền tảng thuê xe tự lái đồng bộ dữ liệu vận hành
              </p>
              <div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Chọn xe thật, kiểm tra lịch thật, đặt thuê rõ ràng.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                  datxe hiển thị đội xe đang được admin quản lý trực tiếp. Khách hàng xem thông tin, hình ảnh, điểm nhận xe và kiểm tra lịch trống trước khi đặt cọc.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/vehicles" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 text-base font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
                  Xem xe sẵn sàng
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link href="/booking" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-base font-bold text-slate-800 transition hover:bg-slate-50">
                  <CalendarClock className="h-5 w-5" />
                  Kiểm tra theo lịch
                </Link>
              </div>
            </div>

            <div className="relative min-h-[340px] overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-sm">
              <Image
                src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
                alt="Xe tự lái tại showroom"
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5 text-white">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/15 p-3 backdrop-blur">
                    <p className="text-xs text-white/70">Nguồn dữ liệu</p>
                    <p className="font-bold">API quản trị xe</p>
                  </div>
                  <div className="rounded-lg bg-white/15 p-3 backdrop-blur">
                    <p className="text-xs text-white/70">Trạng thái thuê</p>
                    <p className="font-bold">Kiểm tra booking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SearchBar />
        </section>

        <section id="featured" className="border-y border-slate-200 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-black">Xe đang sẵn sàng cho thuê</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Không còn dữ liệu dòng xe hardcode: danh sách bên dưới lấy từ cùng API mà admin đang cập nhật trong dashboard.
                </p>
              </div>
              <Link href="/vehicles" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Xem toàn bộ xe
              </Link>
            </div>

            {loadingCars ? (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">Đang tải xe từ hệ thống…</div>
            ) : featuredCars.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Car className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-lg font-bold">Chưa có xe sẵn sàng</h3>
                <p className="mt-2 text-sm text-slate-600">Admin cần thêm xe trong dashboard, tải ảnh và đặt trạng thái Sẵn sàng để xe xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {featuredCars.map((car) => (
                  <article key={car.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <Link href={`/vehicles/${car.id}`} className="block">
                      <div className="relative aspect-[16/10] bg-slate-100">
                        {car.images[0] ? (
                          <Image src={car.images[0]} alt={`${car.brand} ${car.model}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><Car className="h-12 w-12 text-slate-300" /></div>
                        )}
                        <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Sẵn sàng</span>
                      </div>
                    </Link>
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{car.brand}</p>
                      <h3 className="mt-1 text-xl font-black">{car.model}</h3>
                      <p className="mt-3 text-lg font-black text-emerald-700">{money(car.dailyPrice)}<span className="text-xs font-medium text-slate-500"> / ngày</span></p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                        <span className="rounded-lg bg-slate-50 p-2"><Users className="mb-1 h-4 w-4 text-emerald-700" />{car.seats} chỗ</span>
                        <span className="rounded-lg bg-slate-50 p-2"><Fuel className="mb-1 h-4 w-4 text-emerald-700" />{fuelLabel[car.fuel] || car.fuel}</span>
                        <span className="rounded-lg bg-slate-50 p-2"><Car className="mb-1 h-4 w-4 text-emerald-700" />{transmissionLabel[car.transmission] || car.transmission}</span>
                      </div>
                      <Link href={`/vehicles/${car.id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white hover:bg-emerald-800">Xem giới thiệu xe</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="showroom" className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="flex items-center gap-2 text-3xl font-black"><MapPin className="h-7 w-7 text-emerald-700" />Showroom và hỗ trợ</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
              <p className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><span><strong>Địa chỉ:</strong> {storeInfo.address}</span></p>
              <p className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><span><strong>Hotline:</strong> 1900 8888</span></p>
              <p className="flex gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><span><strong>Giờ làm việc:</strong> {storeInfo.hours}</span></p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.8105742211993!2d105.79815541540188!3d20.999625686016142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135acbe0316d2f3%3A0x7d6f51be676a0c02!2zMTIgS2h14bq_dCBEdXkgVGnhur9uLCBUaGFuaCBYdcOibiwgSMOgIE7hu5lp!5e0!3m2!1svi!2s!4v1655000000000!5m2!1svi!2s"
              width="100%"
              height="320"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Bản đồ showroom datxe"
            />
          </div>
        </section>

        <section id="policy" className="border-y border-slate-200 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="flex items-center justify-center gap-2 text-center text-3xl font-black"><ShieldCheck className="h-7 w-7 text-emerald-700" />Quy trình thuê xe</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {['Chọn lịch thuê', 'Kiểm tra xe rảnh', 'Đặt cọc và gửi hồ sơ', 'Nhận xe và ký hợp đồng'].map((item, index) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 font-black text-white">{index + 1}</span>
                  <h3 className="mt-4 font-bold">{item}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="flex items-center justify-center gap-2 text-center text-3xl font-black"><HelpCircle className="h-7 w-7 text-emerald-700" />Câu hỏi thường gặp</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button type="button" onClick={() => setFaqOpen(faqOpen === index ? null : index)} className="flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left font-bold hover:bg-slate-50">
                  <span>{faq.q}</span>
                  <span className="text-xl text-emerald-700">{faqOpen === index ? '-' : '+'}</span>
                </button>
                {faqOpen === index && <p className="border-t border-slate-200 px-5 py-4 text-sm leading-6 text-slate-600">{faq.a}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
