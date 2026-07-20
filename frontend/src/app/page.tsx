'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, HelpCircle, MapPin, Award, ChevronRight, Phone, Clock
} from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const featuredCars = [
    {
      id: 'vf8',
      name: 'VinFast VF8',
      brand: 'VinFast',
      type: 'Điện',
      price: '1,200,000đ',
      seats: 5,
      gear: 'Tự động',
      img: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'carnival',
      name: 'Kia Carnival',
      brand: 'Kia',
      type: 'Dầu',
      price: '1,800,000đ',
      seats: 7,
      gear: 'Tự động',
      img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'vios',
      name: 'Toyota Vios',
      brand: 'Toyota',
      type: 'Xăng',
      price: '600,000đ',
      seats: 5,
      gear: 'Số sàn',
      img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const faqs = [
    {
      q: 'Thủ tục thuê xe tự lái cần những giấy tờ gì?',
      a: 'Bạn cần chuẩn bị Căn cước công dân (CCCD) gắn chip bản gốc, Giấy phép lái xe (GPLX) hạng B1/B2 trở lên còn hạn và tài sản thế chấp (xe máy hoặc 15,000,000đ tiền mặt).'
    },
    {
      q: 'Hệ thống tính phí phụ trội quá giờ thế nào?',
      a: 'Mỗi xe đều có mức phạt quá giờ (penaltyRate) quy định rõ trong hợp đồng, dao động từ 80,000đ - 200,000đ/giờ tùy phân khúc xe. Quá 5 giờ sẽ tính thêm 1 ngày thuê.'
    },
    {
      q: 'Xe đã có bảo hiểm chưa và khi xảy ra va chạm xử lý thế nào?',
      a: 'Tất cả xe của datxe đều được mua bảo hiểm thân vỏ tự nguyện đầy đủ. Khi có va chạm, quý khách vui lòng giữ nguyên hiện trường và liên hệ ngay hotline 1900 8888 để được cứu hộ và bảo hiểm hỗ trợ xử lý.'
    },
    {
      q: 'Tôi có thể thay đổi thời gian nhận/trả xe sau khi đã cọc không?',
      a: 'Quý khách hoàn toàn có thể thay đổi thời gian trước giờ nhận xe tối thiểu 12 tiếng qua tổng đài hỗ trợ, miễn là xe đó còn trống lịch ở thời điểm quý khách muốn đổi.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#080b11] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header Layout */}
      <Header />
      <main>

      {/* Hero Section with SearchBar embedded */}
      <section className="relative pt-24 pb-12 px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-[#E6F7EF] dark:bg-emerald-500/10 border border-[#008F5A]/20 dark:border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold text-[#008F5A] dark:text-emerald-400 w-fit">
              <Award className="h-4.5 w-4.5" />
              <span>Thương Hiệu Cho Thuê Xe Uy Tín Hàng Đầu</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-gray-950 dark:text-white">
              Trải Nghiệm Hành Trình <br />
              <span className="text-[#008F5A] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:to-emerald-400">Tự Do & Trọn Vẹn</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed">
              Hệ thống đặt xe tự lái tự động 100%. Chọn ngày, quét mã QR nhận xe lập tức. Đội ngũ xe đời mới, bảo hiểm toàn diện và dịch vụ hỗ trợ cứu hộ 24/7 chuyên nghiệp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/booking" className="bg-[#008F5A] hover:bg-[#007A4D] text-white text-center font-medium py-3 px-8 rounded-lg text-lg flex items-center justify-center gap-2 transition hover:scale-[1.02] duration-200">
                <span>Bắt đầu chuyến đi</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <a href="#featured" className="bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-center text-gray-700 dark:text-gray-300 font-medium py-3 px-8 rounded-lg text-lg border border-gray-200 dark:border-white/5 transition flex items-center justify-center gap-2">
                Xem bảng giá
              </a>
            </div>
          </div>

          <div className="relative h-[300px] md:h-[420px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
            <Image
              src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80" 
              alt="Showroom Car" 
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#080b11] via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 flex gap-4">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Dòng xe đời mới</span>
                <span className="text-sm font-bold text-gray-950 dark:text-white">100+ Xe có sẵn</span>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Đã hoàn thành</span>
                <span className="text-sm font-bold text-gray-950 dark:text-white">5,000+ Chuyến đi</span>
              </div>
            </div>
          </div>
        </div>

        {/* SearchBar floating at the bottom of the Hero Section */}
        <div className="w-full mt-4">
          <SearchBar />
        </div>
      </section>

      {/* Showroom & Location Info */}
      <section id="showroom" className="bg-white dark:bg-gray-950/30 border-y border-gray-150 dark:border-white/5 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2 text-gray-950 dark:text-white">
              <MapPin className="text-[#008F5A] h-7 w-7" />
              <span>Showroom của chúng tôi</span>
            </h2>
            <div className="space-y-6 text-gray-600 dark:text-gray-400">
              <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span><strong>Địa chỉ chính thức:</strong> Số 12 Khuất Duy Tiến, Thanh Xuân, Hà Nội</span></p>
              <p className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span><strong>Hotline đặt lịch khẩn cấp:</strong> 1900 8888 (Hỗ trợ 24/7)</span></p>
              <p className="flex items-start gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span><strong>Giờ làm việc:</strong> 07:00–22:00 (Cả ngày lễ và Chủ nhật)</span></p>
              <p>Hệ thống bàn giao xe trực tiếp tại showroom hoặc hỗ trợ giao xe tận nhà trong bán kính 10km cực kỳ nhanh chóng.</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 h-[300px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.8105742211993!2d105.79815541540188!3d20.999625686016142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135acbe0316d2f3%3A0x7d6f51be676a0c02!2zMTIgS2h14bq_dCBEdXkgVGnhur9uLCBUaGFuaCBYdcOibiwgSMOgIE7hu5lp!5e0!3m2!1svi!2s!4v1655000000000!5m2!1svi!2s" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section id="featured" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-gray-950 dark:text-white">Các Dòng Xe Nổi Bật</h2>
          <p className="text-gray-600 dark:text-gray-400">Đa dạng lựa chọn từ Sedan đô thị tiết kiệm đến SUV 7 chỗ rộng rãi, sẵn sàng đáp ứng mọi cung đường của bạn.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredCars.map((car) => (
            <div key={car.id} className="bg-white dark:bg-gray-950/20 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 flex flex-col group hover:border-[#008F5A]/20 dark:hover:border-emerald-500/20 transition-all duration-300 shadow-sm">
              <div className="relative h-[200px] overflow-hidden">
                <Image
                  src={car.img} 
                  alt={car.name} 
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-4 right-4 bg-[#008F5A]/90 dark:bg-emerald-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                  {car.type}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-grow gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-400 block uppercase tracking-wider">{car.brand}</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{car.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Giá thuê chỉ từ</span>
                    <span className="text-lg font-bold text-[#008F5A] dark:text-emerald-400">{car.price}/ngày</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 text-center">
                  <div>
                    <span className="block text-gray-400 mb-0.5">Số ghế</span>
                    <strong className="text-gray-900 dark:text-white">{car.seats} Ghế</strong>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-0.5">Hộp số</span>
                    <strong className="text-gray-900 dark:text-white">{car.gear}</strong>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-0.5">Nhiên liệu</span>
                    <strong className="text-gray-900 dark:text-white">{car.type}</strong>
                  </div>
                </div>

                <Link href="/booking" className="bg-[#008F5A] hover:bg-[#007A4D] text-center text-white py-2.5 rounded-lg text-sm font-semibold mt-auto block transition duration-200">
                  Đăng ký đặt xe
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Policy Section */}
      <section id="policy" className="bg-white dark:bg-gray-950/20 border-y border-gray-150 dark:border-white/5 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2 text-gray-950 dark:text-white">
              <ShieldCheck className="text-[#008F5A]" />
              <span>Chính Sách & Quy Trình Thuê Xe</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Đơn giản, minh bạch và bảo vệ tối đa quyền lợi cho khách hàng.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-950/10 p-6 rounded-xl border border-gray-150 dark:border-white/5 text-center flex flex-col items-center gap-4 shadow-xs">
              <div className="h-12 w-12 rounded-full bg-[#E6F7EF] dark:bg-emerald-500/10 border border-[#008F5A]/20 dark:border-emerald-500/20 flex items-center justify-center text-[#008F5A] dark:text-emerald-400 font-bold text-lg">1</div>
              <h3 className="font-bold text-gray-900 dark:text-white">1. Chọn Lịch Trình</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chọn thời gian nhận/trả xe và lọc dòng xe yêu thích còn trống lịch trực tuyến.</p>
            </div>
            <div className="bg-white dark:bg-gray-950/10 p-6 rounded-xl border border-gray-150 dark:border-white/5 text-center flex flex-col items-center gap-4 shadow-xs">
              <div className="h-12 w-12 rounded-full bg-[#E6F7EF] dark:bg-emerald-500/10 border border-[#008F5A]/20 dark:border-emerald-500/20 flex items-center justify-center text-[#008F5A] dark:text-emerald-400 font-bold text-lg">2</div>
              <h3 className="font-bold text-gray-900 dark:text-white">2. Điền Form & Cọc</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload ảnh CCCD và GPLX lên hệ thống. Đặt cọc giữ xe qua MoMo hoặc chuyển khoản VietQR.</p>
            </div>
            <div className="bg-white dark:bg-gray-950/10 p-6 rounded-xl border border-gray-150 dark:border-white/5 text-center flex flex-col items-center gap-4 shadow-xs">
              <div className="h-12 w-12 rounded-full bg-[#E6F7EF] dark:bg-emerald-500/10 border border-[#008F5A]/20 dark:border-emerald-500/20 flex items-center justify-center text-[#008F5A] dark:text-emerald-400 font-bold text-lg">3</div>
              <h3 className="font-bold text-gray-900 dark:text-white">3. Bàn Giao Xe</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nhân viên liên hệ bàn giao xe trực tiếp tại showroom, ký hợp đồng điện tử siêu tốc.</p>
            </div>
            <div className="bg-white dark:bg-gray-950/10 p-6 rounded-xl border border-gray-150 dark:border-white/5 text-center flex flex-col items-center gap-4 shadow-xs">
              <div className="h-12 w-12 rounded-full bg-[#E6F7EF] dark:bg-emerald-500/10 border border-[#008F5A]/20 dark:border-emerald-500/20 flex items-center justify-center text-[#008F5A] dark:text-emerald-400 font-bold text-lg">4</div>
              <h3 className="font-bold text-gray-900 dark:text-white">4. Trả Xe Hoàn Cọc</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bàn giao xe sạch sẽ, nhận lại tài sản thế chấp sau khi nhân viên thẩm định tình trạng xe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2 text-gray-950 dark:text-white">
            <HelpCircle className="text-[#008F5A]" />
            <span>Câu Hỏi Thường Gặp (FAQs)</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Tổng hợp các thông tin chi tiết giải đáp thắc mắc của bạn.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-gray-950/20 rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-300">
              <button 
                type="button"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full text-left p-6 font-semibold flex justify-between items-center text-gray-800 dark:text-white hover:text-[#008F5A] dark:hover:text-emerald-400 transition"
              >
                <span>{faq.q}</span>
                <span className="text-[#008F5A] dark:text-emerald-500 font-bold text-lg">{faqOpen === i ? '-' : '+'}</span>
              </button>
              {faqOpen === i && (
                <div className="p-6 pt-0 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-white/5 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      </main>

      {/* Footer Layout */}
      <Footer />
    </div>
  );
}
