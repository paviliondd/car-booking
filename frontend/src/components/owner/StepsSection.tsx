'use client';

import React from 'react';
import { FileText, UserCheck, Car } from 'lucide-react';

export default function StepsSection() {
  const steps = [
    {
      id: 1,
      icon: <FileText className="h-8 w-8 text-brand" />,
      title: 'Điền thông tin xe',
      desc: 'Cung cấp khu vực, thông tin chủ xe và dòng xe muốn cho thuê để đội ngũ datxe tư vấn hồ sơ phù hợp.',
    },
    {
      id: 2,
      icon: <UserCheck className="h-8 w-8 text-brand" />,
      title: 'Xác nhận hồ sơ',
      desc: 'Nhân viên datxe liên hệ chủ xe, kiểm tra giấy tờ và thống nhất quy trình bàn giao trong vòng 1 ngày làm việc.',
    },
    {
      id: 3,
      icon: <Car className="h-8 w-8 text-brand" />,
      title: 'Duyệt xe',
      desc: 'Xe được đưa lên hệ thống datxe sau khi phê duyệt, sẵn sàng nhận lịch thuê và theo dõi doanh thu.',
    },
  ];

  return (
    <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-10">
      <h2 className="text-2xl md:text-3xl font-extrabold text-center text-content dark:text-night-content">
        3 bước đăng ký xe trên <span className="text-brand">datxe</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className="relative bg-utility border border-brand/25 rounded-2xl p-8 flex flex-col gap-4 shadow-xs transition hover:shadow-md hover:border-brand/20 duration-300"
          >
            {/* Absolute badge number top-right */}
            <div className="absolute top-4 right-4 bg-brand text-on-brand text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {step.id}
            </div>

            {/* Icon */}
            <div className="p-3 bg-app-surface rounded-xl w-fit">
              {step.icon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-content">{step.title}</h3>

            {/* Description */}
            <p className="text-xs text-content-secondary leading-relaxed whitespace-pre-line">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
