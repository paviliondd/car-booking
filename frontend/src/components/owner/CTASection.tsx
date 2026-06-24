'use client';

import React from 'react';
import Link from 'next/link';
import { Car } from 'lucide-react';

interface CTASectionProps {
  onRegisterClick: () => void;
}

export default function CTASection({ onRegisterClick }: CTASectionProps) {
  return (
    <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
      <div className="bg-emerald-50 rounded-3xl overflow-hidden grid md:grid-cols-2 items-center shadow-xs border border-emerald-100">
        
        {/* Left column text */}
        <div className="p-8 md:p-16 flex flex-col gap-6 items-start text-left">
          <div className="p-3 bg-white rounded-2xl">
            <Car className="h-8 w-8 text-[#008F5A]" />
          </div>
          
          <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            Bạn muốn cho thuê xe?
          </h2>
          
          <p className="text-sm text-gray-600 leading-relaxed max-w-md">
            Chủ xe có thể đăng ký, theo dõi hồ sơ và quản lý lịch cho thuê ngay trong hệ thống datxe. Dữ liệu tập trung, quy trình rõ ràng, vận hành nhẹ hơn mỗi ngày.
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <Link
              href="/about"
              className="border border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 font-bold py-2.5 px-6 rounded-lg text-sm transition cursor-pointer"
            >
              Tìm hiểu ngay
            </Link>
            <button 
              onClick={onRegisterClick}
              className="bg-[#008F5A] hover:bg-[#007A4D] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition cursor-pointer shadow-md hover:scale-105 active:scale-95 duration-200"
            >
              Đăng ký xe
            </button>
          </div>
        </div>

        {/* Right column image with diagonal cut */}
        <div className="relative h-[320px] md:h-full min-h-[360px] w-full hidden md:block overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80" 
            alt="Hand on steering wheel with bokeh lights" 
            className="w-full h-full object-cover"
            style={{
              clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)'
            }}
          />
        </div>
      </div>
    </section>
  );
}
