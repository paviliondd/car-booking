'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Car, ShieldCheck, HelpCircle, Phone, MapPin, 
  Clock, Award, Calendar, ChevronRight, Menu, X 
} from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      a: 'Tất cả xe của DATXE đều được mua bảo hiểm thân vỏ tự nguyện đầy đủ. Khi có va chạm, quý khách vui lòng giữ nguyên hiện trường và liên hệ ngay hotline 1900 8888 để được cứu hộ và bảo hiểm hỗ trợ xử lý.'
    },
    {
      q: 'Tôi có thể thay đổi thời gian nhận/trả xe sau khi đã cọc không?',
      a: 'Quý khách hoàn toàn có thể thay đổi thời gian trước giờ nhận xe tối thiểu 12 tiếng qua tổng đài hỗ trợ, miễn là xe đó còn trống lịch ở thời điểm quý khách muốn đổi.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#080b11]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-wider text-purple-400">
          <Car className="h-8 w-8 text-purple-500 animate-pulse" />
          <span>DAT<span className="text-white">XE</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#showroom" className="hover:text-purple-400 transition">Showroom</Link>
          <Link href="#featured" className="hover:text-purple-400 transition">Danh Sách Xe</Link>
          <Link href="#policy" className="hover:text-purple-400 transition">Chính Sách</Link>
          <Link href="#faq" className="hover:text-purple-400 transition">Hỏi Đáp</Link>
          <Link href="/track" className="hover:text-purple-400 transition">Tra Cứu Đơn</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="tel:19008888" className="flex items-center gap-2 text-sm text-purple-400 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
            <Phone className="h-4 w-4" />
            <span>1900 8888</span>
          </a>
          <Link href="/dashboard" className="text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition border border-white/10">
            Chủ Xe
          </Link>
          <Link href="/booking" className="text-sm font-medium gradient-btn text-white px-5 py-2 rounded-lg transition">
            Đặt Xe Ngay
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[69px] inset-0 z-40 bg-[#080b11] border-t border-white/5 p-6 flex flex-col gap-6">
          <Link href="#showroom" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white">Showroom</Link>
          <Link href="#featured" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white">Danh Sách Xe</Link>
          <Link href="#policy" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white">Chính Sách</Link>
          <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white">Hỏi Đáp</Link>
          <Link href="/track" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white">Tra Cứu Đơn</Link>
          <hr className="border-white/10" />
          <Link href="/booking" onClick={() => setMobileMenuOpen(false)} className="gradient-btn text-center text-white py-3 rounded-lg">
            Đặt Xe Ngay
          </Link>
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="bg-gray-800 text-center text-white py-3 rounded-lg border border-white/10">
            Trang Quản Trị
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-24 px-6 md:px-12 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold text-purple-400 w-fit">
            <Award className="h-4.5 w-4.5" />
            <span>Thương Hiệu Cho Thuê Xe Uy Tín Hàng Đầu</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Trải Nghiệm Hành Trình <br />
            <span className="gradient-text">Tự Do & Trọn Vẹn</span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed">
            Hệ thống đặt xe tự lái tự động 100%. Chọn ngày, quét mã QR nhận xe lập tức. Đội ngũ xe đời mới, bảo hiểm toàn diện và dịch vụ hỗ trợ cứu hộ 24/7 chuyên nghiệp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/booking" className="gradient-btn text-center text-white font-medium py-3 px-8 rounded-lg text-lg flex items-center justify-center gap-2">
              <span>Bắt đầu chuyến đi</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
            <a href="#featured" className="bg-gray-900/50 hover:bg-gray-800 text-center text-gray-300 font-medium py-3 px-8 rounded-lg text-lg border border-white/5 transition flex items-center justify-center gap-2">
              Xem bảng giá
            </a>
          </div>
        </div>

        <div className="relative h-[300px] md:h-[420px] rounded-2xl overflow-hidden border border-white/10">
          <img 
            src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80" 
            alt="Showroom Car" 
            className="object-cover w-full h-full hover:scale-105 transition duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 flex gap-4">
            <div className="glass-panel px-4 py-2 rounded-lg border border-white/10">
              <span className="text-xs text-gray-400 block">Dòng xe đời mới</span>
              <span className="text-sm font-bold text-white">100+ Xe có sẵn</span>
            </div>
            <div className="glass-panel px-4 py-2 rounded-lg border border-white/10">
              <span className="text-xs text-gray-400 block">Đã hoàn thành</span>
              <span className="text-sm font-bold text-white">5,000+ Chuyến đi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom & Location Info */}
      <section id="showroom" className="bg-gray-950/30 border-y border-white/5 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="text-purple-500 h-7 w-7" />
              <span>Showroom của chúng tôi</span>
            </h2>
            <div className="space-y-6 text-gray-400">
              <p>📍 <strong>Địa chỉ chính thức:</strong> Số 12 Khuất Duy Tiến, Thanh Xuân, Hà Nội</p>
              <p>📞 <strong>Hotline đặt lịch khẩn cấp:</strong> 1900 8888 (Hỗ trợ 24/7)</p>
              <p>⏰ <strong>Giờ làm việc:</strong> 07:00 AM - 10:00 PM (Cả ngày lễ và Chủ nhật)</p>
              <p>Hệ thống bàn giao xe trực tiếp tại showroom hoặc hỗ trợ giao xe tận nhà trong bán kính 10km cực kỳ nhanh chóng.</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10 h-[300px]">
            {/* Google Map Mock - Embeed map Iframe */}
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
          <h2 className="text-3xl font-bold mb-4">Các Dòng Xe Nổi Bật</h2>
          <p className="text-gray-400">Đa dạng lựa chọn từ Sedan đô thị tiết kiệm đến SUV 7 chỗ rộng rãi, sẵn sàng đáp ứng mọi cung đường của bạn.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredCars.map((car) => (
            <div key={car.id} className="glass-panel rounded-xl overflow-hidden border border-white/5 flex flex-col group hover:border-purple-500/20 transition-all duration-300">
              <div className="relative h-[200px] overflow-hidden">
                <img 
                  src={car.img} 
                  alt={car.name} 
                  className="object-cover w-full h-full group-hover:scale-105 transition duration-500" 
                />
                <span className="absolute top-4 right-4 bg-purple-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                  {car.type}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-grow gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-500 block uppercase tracking-wider">{car.brand}</span>
                    <h3 className="text-xl font-bold text-white mt-1">{car.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Giá thuê chỉ từ</span>
                    <span className="text-lg font-bold text-purple-400">{car.price}/ngày</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-xs text-gray-400 text-center">
                  <div>
                    <span className="block text-gray-500 mb-0.5">Số ghế</span>
                    <strong>{car.seats} Ghế</strong>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-0.5">Hộp số</span>
                    <strong>{car.gear}</strong>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-0.5">Nhiên liệu</span>
                    <strong>{car.type}</strong>
                  </div>
                </div>

                <Link href="/booking" className="gradient-btn text-center text-white py-2.5 rounded-lg text-sm font-semibold mt-auto block">
                  Đăng ký đặt xe
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Policy Section */}
      <section id="policy" className="bg-gray-950/20 border-y border-white/5 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <ShieldCheck className="text-purple-500" />
              <span>Chính Sách & Quy Trình Thuê Xe</span>
            </h2>
            <p className="text-gray-400">Đơn giản, minh bạch và bảo vệ tối đa quyền lợi cho khách hàng.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="glass-panel p-6 rounded-xl border border-white/5 text-center flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">1</div>
              <h3 className="font-bold text-white">1. Chọn Lịch Trình</h3>
              <p className="text-xs text-gray-400">Chọn thời gian nhận/trả xe và lọc dòng xe yêu thích còn trống lịch trực tuyến.</p>
            </div>
            <div className="glass-panel p-6 rounded-xl border border-white/5 text-center flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">2</div>
              <h3 className="font-bold text-white">2. Điền Form & Cọc</h3>
              <p className="text-xs text-gray-400">Upload ảnh CCCD và GPLX lên hệ thống. Đặt cọc giữ xe qua MoMo hoặc chuyển khoản VietQR.</p>
            </div>
            <div className="glass-panel p-6 rounded-xl border border-white/5 text-center flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">3</div>
              <h3 className="font-bold text-white">3. Bàn Giao Xe</h3>
              <p className="text-xs text-gray-400">Nhân viên liên hệ bàn giao xe trực tiếp tại showroom, ký hợp đồng điện tử siêu tốc.</p>
            </div>
            <div className="glass-panel p-6 rounded-xl border border-white/5 text-center flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">4</div>
              <h3 className="font-bold text-white">4. Trả Xe Hoàn Cọc</h3>
              <p className="text-xs text-gray-400">Bàn giao xe sạch sẽ, nhận lại tài sản thế chấp sau khi nhân viên thẩm định tình trạng xe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
            <HelpCircle className="text-purple-500" />
            <span>Câu Hỏi Thường Gặp (FAQs)</span>
          </h2>
          <p className="text-gray-400">Tổng hợp các thông tin chi tiết giải đáp thắc mắc của bạn.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-panel rounded-xl border border-white/5 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full text-left p-6 font-semibold flex justify-between items-center hover:text-purple-400 transition"
              >
                <span>{faq.q}</span>
                <span className="text-purple-500 font-bold text-lg">{faqOpen === i ? '-' : '+'}</span>
              </button>
              {faqOpen === i && (
                <div className="p-6 pt-0 text-sm text-gray-400 border-t border-white/5 leading-relaxed bg-white/1">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-[#05080c] py-12 px-6 md:px-12 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xl font-bold tracking-wider text-purple-400">
            <Car className="h-6 w-6 text-purple-500" />
            <span>DAT<span className="text-white">XE</span></span>
          </div>
          <p>© 2026 DATXE Inc. Phát triển bởi Senior Fullstack Solution Architect.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-400">Chính sách bảo mật</Link>
            <Link href="/terms" className="hover:text-gray-400">Điều khoản sử dụng</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
