'use client';

import React from 'react';
import { FileText, UserCheck, Car } from 'lucide-react';

export default function StepsSection() {
  const steps = [
    {
      id: 1,
      icon: <FileText className="h-8 w-8 text-[#00B14F]" />,
      title: 'Tải app và điền thông tin',
      desc: 'Cách 1: Tải app Mioto, vào mục Quản lý cho thuê và đăng ký xe theo hướng dẫn.\nCách 2: Điền thông tin theo mẫu để Mioto hỗ trợ tư vấn quy trình đăng ký. (Mẫu đăng ký)',
    },
    {
      id: 2,
      icon: <UserCheck className="h-8 w-8 text-[#00B14F]" />,
      title: 'Xác nhận thông tin',
      desc: 'Nhân viên Mioto liên hệ chủ xe tư vấn thủ tục & quy trình cho thuê xe trong vòng 1 ngày sau khi nhận được thông tin.',
    },
    {
      id: 3,
      icon: <Car className="h-8 w-8 text-[#00B14F]" />,
      title: 'Duyệt xe',
      desc: 'Bắt đầu cho thuê xe trên Mioto sau khi nhận thông báo xe đã được phê duyệt.',
    },
  ];

  return (
    <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-10">
      <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-950 dark:text-white">
        3 bước đăng ký xe trên <span className="text-[#00B14F]">MIOTO</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className="relative bg-[#F7FFF9] border border-[#E0F5E9] rounded-2xl p-8 flex flex-col gap-4 shadow-xs transition hover:shadow-md hover:border-[#00B14F]/20 duration-300"
          >
            {/* Absolute badge number top-right */}
            <div className="absolute top-4 right-4 bg-[#00B14F] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {step.id}
            </div>

            {/* Icon */}
            <div className="p-3 bg-[#E0F5E9]/50 rounded-xl w-fit">
              {step.icon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>

            {/* Description */}
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
