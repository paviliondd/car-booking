'use client';

import React from 'react';
import Link from 'next/link';
import { Car, Mail, MapPin, Phone, Shield } from 'lucide-react';
import { storeInfo } from '@/lib/store';

const linkClass = 'text-sm text-slate-600 hover:text-[#008F5A] leading-relaxed transition';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-emerald-100 pt-14 pb-10 text-slate-700">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[#008F5A]">
            <Car className="h-7 w-7" />
            <span>dat<span className="text-slate-950">xe</span></span>
          </Link>

          <div className="flex items-center gap-2 text-xl font-bold text-slate-950">
            <Phone className="h-5 w-5 text-[#008F5A]" />
            <span>1900 8888</span>
          </div>
          <span className="text-xs text-slate-500">Tổng đài hỗ trợ: 7AM - 10PM</span>

          <a href="mailto:contact@datxe.vn" className="flex items-center gap-2 text-sm text-[#008F5A] hover:underline w-fit font-medium">
            <Mail className="h-4 w-4" />
            <span>contact@datxe.vn</span>
          </a>
          <span className="text-xs text-slate-500">Gửi mail cho datxe</span>

          <div className="flex gap-3 mt-2">
            {['f', 'TikTok', 'Zalo'].map((item) => (
              <a key={item} href="#" className="h-8 min-w-8 px-2 rounded-full bg-emerald-50 hover:bg-emerald-100 hover:text-[#008F5A] transition flex items-center justify-center text-slate-500 font-bold text-xs">
                {item}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-[15px] text-slate-950 mb-4">Chính sách</h4>
          <ul className="flex flex-col gap-2">
            <li><Link href="/about#policy" className={linkClass}>Chính sách & quy định</Link></li>
            <li><Link href="/about#process" className={linkClass}>Quy chế hoạt động</Link></li>
            <li><Link href="/about#privacy" className={linkClass}>Chính sách BVDLCN</Link></li>
            <li><Link href="/about#support" className={linkClass}>Giải quyết khiếu nại</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[15px] text-slate-950 mb-4">Tìm hiểu thêm</h4>
          <ul className="flex flex-col gap-2">
            <li><Link href="/about" className={linkClass}>Về datxe</Link></li>
            <li><Link href="/booking" className={linkClass}>Hướng dẫn đặt xe</Link></li>
            <li><Link href="/payment" className={linkClass}>Hướng dẫn thanh toán</Link></li>
            <li><Link href="/#faq" className={linkClass}>Hỏi và trả lời</Link></li>
            <li><Link href="/track" className={linkClass}>Tra cứu đơn đặt xe</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[15px] text-slate-950 mb-4">Đối tác</h4>
          <ul className="flex flex-col gap-2">
            <li><Link href="/become-owner" className={linkClass}>Đăng ký chủ xe datxe</Link></li>
            <li><Link href="/owner" className={linkClass}>Khu vực chủ xe</Link></li>
            <li><Link href="/owner/add-car" className={linkClass}>Thêm xe cho thuê</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-emerald-100 pt-6 px-6 md:px-12 max-w-7xl mx-auto text-[13px] text-slate-500">
        <div className="flex flex-col md:flex-row justify-between gap-3 mb-4 leading-relaxed">
          <span>© 2026 Công ty Cổ phần datxe Việt Nam</span>
          <span>Số GCNĐKKD: 0109999999 | Ngày cấp: 24-06-26 | Nơi cấp: Sở Kế hoạch và Đầu tư Hà Nội</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 border-t border-slate-100 pt-4">
          <span className="max-w-xl flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-[#008F5A]" />
            Văn phòng: {storeInfo.address} · {storeInfo.hours}
          </span>
          <span className="md:text-right">
            TK: 1029384756 (VND) - Công ty Cổ phần datxe Việt Nam - MB Bank chi nhánh Hà Nội
          </span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
            <Shield className="h-5 w-5 text-[#008F5A]" />
            <span className="font-extrabold text-[10px] text-emerald-800 tracking-wider uppercase">Đã đăng ký Bộ Công Thương</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold mr-1">Phương thức thanh toán:</span>
            {['Momo', 'VNPay', 'VietQR', 'VISA', 'ZaloPay'].map((method) => (
              <span key={method} className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
