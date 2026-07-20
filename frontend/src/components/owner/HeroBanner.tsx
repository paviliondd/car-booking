'use client';

import React from 'react';
import Image from 'next/image';

interface HeroBannerProps {
  onRegisterClick: () => void;
}

export default function HeroBanner({ onRegisterClick }: HeroBannerProps) {
  return (
    <section className="relative h-[480px] md:h-[540px] w-full overflow-hidden bg-gray-950">
      <Image
        src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1600&q=80" 
        alt="Chủ xe datxe" 
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-85"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/25 via-slate-950/55 to-slate-950/80 md:to-slate-950/70"></div>

      {/* Content Container (Aligned right on desktop) */}
      <div className="relative max-w-7xl mx-auto h-full px-6 md:px-12 flex items-center justify-end">
        <div className="max-w-md md:max-w-lg flex flex-col gap-6 text-white text-right items-end">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Trở thành đối tác <br />
            chủ xe của <span className="text-emerald-300">datxe</span>
          </h2>
          <p className="text-gray-200 text-sm md:text-base leading-relaxed">
            Chia sẻ xe nhàn rỗi, tối ưu lịch cho thuê và theo dõi thu nhập ngay trên hệ thống datxe.
          </p>
          <button 
            onClick={onRegisterClick}
            className="bg-[#008F5A] hover:bg-[#007A4D] text-white font-bold py-3 px-8 rounded-lg text-base md:text-lg cursor-pointer transition shadow-lg hover:scale-105 active:scale-95 duration-200"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </section>
  );
}
