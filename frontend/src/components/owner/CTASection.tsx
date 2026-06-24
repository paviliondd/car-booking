'use client';

import React from 'react';
import { Car } from 'lucide-react';

interface CTASectionProps {
  onRegisterClick: () => void;
}

export default function CTASection({ onRegisterClick }: CTASectionProps) {
  return (
    <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
      <div className="bg-[#EEF6FF] rounded-3xl overflow-hidden grid md:grid-cols-2 items-center shadow-xs">
        
        {/* Left column text */}
        <div className="p-8 md:p-16 flex flex-col gap-6 items-start text-left">
          <div className="p-3 bg-[#2196F3]/10 rounded-2xl">
            <Car className="h-8 w-8 text-[#2196F3]" />
          </div>
          
          <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            Bạn muốn cho thuê xe?
          </h2>
          
          <p className="text-sm text-gray-600 leading-relaxed max-w-md">
            Hơn 10.000 chủ xe đang cho thuê hiệu quả trên Mioto. Đăng ký trở thành đối tác của chúng tôi ngay hôm nay để gia tăng thu nhập hàng tháng.
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <button 
              onClick={() => window.open('https://mioto.vn', '_blank')}
              className="border border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 font-bold py-2.5 px-6 rounded-lg text-sm transition cursor-pointer"
            >
              Tìm hiểu ngay
            </button>
            <button 
              onClick={onRegisterClick}
              className="bg-[#2196F3] hover:bg-[#1e88e5] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition cursor-pointer shadow-md hover:scale-105 active:scale-95 duration-200"
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
