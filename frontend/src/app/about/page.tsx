'use client';

import React from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="bg-white border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold text-[#008F5A] w-fit">
                <Car className="h-4 w-4" />
                Nền tảng thuê xe tự lái datxe
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-slate-950">
                Đặt xe nhanh, quản lý rõ, đồng hành minh bạch.
              </h1>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                datxe được xây dựng cho nhu cầu thuê xe tự lái tại Việt Nam: tìm xe, đặt lịch, thanh toán, theo dõi hợp đồng và hỗ trợ vận hành trên cùng một hệ thống.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/booking" className="bg-[#008F5A] hover:bg-[#007A4D] text-white font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition">
                  Đặt xe ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/become-owner" className="border border-slate-300 hover:border-[#008F5A] hover:text-[#008F5A] font-bold px-6 py-3 rounded-lg text-center transition">
                  Cho thuê xe
                </Link>
              </div>
            </div>

            <div className="relative h-[320px] md:h-[420px] overflow-hidden rounded-2xl border border-emerald-100 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
                alt="Xe tự lái datxe"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-6">
                <div className="grid grid-cols-3 gap-3">
                  {stats.map((item) => (
                    <div key={item.label} className="rounded-lg bg-white/90 p-3 text-center backdrop-blur">
                      <div className="text-lg font-extrabold text-[#008F5A]">{item.value}</div>
                      <div className="text-[11px] text-slate-600">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-[#008F5A] mb-4" />
              <h2 className="font-bold text-lg mb-2">Quy trình minh bạch</h2>
              <p className="text-sm text-slate-600 leading-relaxed">Lịch thuê, giá, cọc, hợp đồng và trạng thái thanh toán được hiển thị rõ ràng để giảm sai sót khi vận hành.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
              <Users className="h-8 w-8 text-[#008F5A] mb-4" />
              <h2 className="font-bold text-lg mb-2">Kết nối khách và chủ xe</h2>
              <p className="text-sm text-slate-600 leading-relaxed">Chủ xe có khu vực quản lý riêng, khách thuê có luồng đặt xe và tra cứu đơn thuận tiện.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
              <Headphones className="h-8 w-8 text-[#008F5A] mb-4" />
              <h2 className="font-bold text-lg mb-2">Hỗ trợ liên tục</h2>
              <p className="text-sm text-slate-600 leading-relaxed">Đội ngũ hỗ trợ tiếp nhận thông tin đặt xe, sự cố, khiếu nại và yêu cầu nâng cấp chủ xe.</p>
            </div>
          </div>
        </section>

        <section id="policy" className="bg-white border-y border-emerald-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-extrabold mb-4 text-slate-950">Chính sách vận hành</h2>
              <p className="text-slate-600 leading-relaxed">
                datxe ưu tiên dữ liệu đặt xe chính xác, xác minh thông tin khách thuê, bảo vệ quyền lợi chủ xe và ghi nhận đầy đủ các bước thanh toán, bàn giao, trả xe.
              </p>
            </div>
            <div id="privacy" className="space-y-3">
              {['Xác minh thông tin khách thuê trước khi bàn giao', 'Theo dõi trạng thái đơn và hợp đồng điện tử', 'Bảo vệ dữ liệu cá nhân theo mục đích sử dụng dịch vụ', 'Tiếp nhận khiếu nại qua hotline và email hỗ trợ'].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-[#008F5A] mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="support" className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <div className="rounded-2xl bg-[#008F5A] p-8 md:p-10 text-white flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold mb-2">Cần hỗ trợ thêm?</h2>
              <p className="text-emerald-50">Liên hệ datxe qua hotline 1900 8888 hoặc email contact@datxe.vn.</p>
            </div>
            <Link href="/track" className="bg-white text-[#008F5A] hover:bg-emerald-50 font-bold px-6 py-3 rounded-lg transition">
              Tra cứu đơn
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
