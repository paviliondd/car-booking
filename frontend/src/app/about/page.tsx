'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Car, CheckCircle2, Headphones, ShieldCheck, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const stats = [
  { label: 'Xe sẵn sàng', value: '100+' },
  { label: 'Chuyến đi hoàn tất', value: '5.000+' },
  { label: 'Hỗ trợ mỗi ngày', value: '24/7' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-app-muted text-content">
      <Header />

      <main>
        <section className="bg-app-surface border-b border-brand/25">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-utility border border-brand/25 px-3 py-1 rounded-full text-xs font-bold text-brand w-fit">
                <Car className="h-4 w-4" />
                Nền tảng thuê xe tự lái datxe
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-content">
                Đặt xe nhanh, quản lý rõ, đồng hành minh bạch.
              </h1>
              <p className="text-content-secondary text-base md:text-lg leading-relaxed">
                datxe được xây dựng cho nhu cầu thuê xe tự lái tại Việt Nam: tìm xe, đặt lịch, thanh toán, theo dõi hợp đồng và hỗ trợ vận hành trên cùng một hệ thống.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/booking" className="bg-brand hover:bg-brand-hover text-on-brand font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition">
                  Đặt xe ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/become-owner" className="border border-app-border hover:border-brand hover:text-brand font-bold px-6 py-3 rounded-lg text-center transition">
                  Cho thuê xe
                </Link>
              </div>
            </div>

            <div className="relative h-[320px] md:h-[420px] overflow-hidden rounded-2xl border border-brand/25 shadow-sm">
              <Image
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
                alt="Xe tự lái datxe"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-night-surface/75 p-6">
                <div className="grid grid-cols-3 gap-3">
                  {stats.map((item) => (
                    <div key={item.label} className="rounded-lg bg-app-surface/90 p-3 text-center backdrop-blur">
                      <div className="text-lg font-extrabold text-brand">{item.value}</div>
                      <div className="text-[11px] text-content-secondary">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-app-surface border border-app-border/25 rounded-xl p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-brand mb-4" />
              <h2 className="font-bold text-lg mb-2">Quy trình minh bạch</h2>
              <p className="text-sm text-content-secondary leading-relaxed">Lịch thuê, giá, cọc, hợp đồng và trạng thái thanh toán được hiển thị rõ ràng để giảm sai sót khi vận hành.</p>
            </div>
            <div className="bg-app-surface border border-app-border/25 rounded-xl p-6 shadow-sm">
              <Users className="h-8 w-8 text-brand mb-4" />
              <h2 className="font-bold text-lg mb-2">Kết nối khách và chủ xe</h2>
              <p className="text-sm text-content-secondary leading-relaxed">Chủ xe có khu vực quản lý riêng, khách thuê có luồng đặt xe và tra cứu đơn thuận tiện.</p>
            </div>
            <div className="bg-app-surface border border-app-border/25 rounded-xl p-6 shadow-sm">
              <Headphones className="h-8 w-8 text-brand mb-4" />
              <h2 className="font-bold text-lg mb-2">Hỗ trợ liên tục</h2>
              <p className="text-sm text-content-secondary leading-relaxed">Đội ngũ hỗ trợ tiếp nhận thông tin đặt xe, sự cố, khiếu nại và yêu cầu nâng cấp chủ xe.</p>
            </div>
          </div>
        </section>

        <section id="policy" className="bg-app-surface border-y border-brand/25">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-extrabold mb-4 text-content">Chính sách vận hành</h2>
              <p className="text-content-secondary leading-relaxed">
                datxe ưu tiên dữ liệu đặt xe chính xác, xác minh thông tin khách thuê, bảo vệ quyền lợi chủ xe và ghi nhận đầy đủ các bước thanh toán, bàn giao, trả xe.
              </p>
            </div>
            <div id="privacy" className="space-y-3">
              {['Xác minh thông tin khách thuê trước khi bàn giao', 'Theo dõi trạng thái đơn và hợp đồng điện tử', 'Bảo vệ dữ liệu cá nhân theo mục đích sử dụng dịch vụ', 'Tiếp nhận khiếu nại qua hotline và email hỗ trợ'].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-content-secondary">
                  <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="support" className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <div className="rounded-2xl bg-brand p-8 md:p-10 text-on-brand flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold mb-2 text-on-brand">Cần hỗ trợ thêm?</h2>
              <p className="text-on-brand">Liên hệ datxe qua hotline 1900 8888 hoặc email contact@datxe.vn.</p>
            </div>
            <Link href="/track" className="bg-app-surface text-brand hover:bg-utility font-bold px-6 py-3 rounded-lg transition">
              Tra cứu đơn
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
