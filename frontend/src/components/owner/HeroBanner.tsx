'use client';

import React from 'react';

interface HeroBannerProps {
  onRegisterClick: () => void;
}

export default function HeroBanner({ onRegisterClick }: HeroBannerProps) {
  return (
    <section className="relative h-[480px] md:h-[540px] w-full overflow-hidden bg-gray-950">
      {/* Background Image: người lái xe nhìn từ cabin ra cửa sổ phong cảnh đồng quê xanh */}
      <img 
        src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1600&q=80" 
        alt="Mioto Owner Banner" 
        className="absolute inset-0 object-cover w-full h-full opacity-85" 
      />
      {/* Dark overlay specifically heavier on the right side */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/50 to-black/80 md:to-black/70"></div>

      {/* Content Container (Aligned right on desktop) */}
      <div className="relative max-w-7xl mx-auto h-full px-6 md:px-12 flex items-center justify-end">
        <div className="max-w-md md:max-w-lg flex flex-col gap-6 text-white text-right items-end">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Trở thành đối tác <br />
            chủ xe của <span className="text-[#00B14F]">MIOTO</span>
          </h2>
          <p className="text-gray-200 text-sm md:text-base leading-relaxed">
            Cho thuê xe trên Mioto để gia tăng thu nhập hàng tháng và gặp gỡ nhiều bạn bè mới!
          </p>
          <button 
            onClick={onRegisterClick}
            className="bg-[#00B14F] hover:bg-[#009b45] text-white font-bold py-3 px-8 rounded-lg text-base md:text-lg cursor-pointer transition shadow-lg hover:scale-105 active:scale-95 duration-200"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </section>
  );
}
