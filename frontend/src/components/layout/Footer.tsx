'use client';

import React from 'react';
import { Shield, Mail, Phone, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E0E0E0] pt-[60px] pb-10 text-gray-700">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Column 1: Contact info */}
        <div className="flex flex-col gap-4">
          <div className="text-2xl font-bold tracking-wider text-[#00B14F]">
            MIOTO
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Phone className="h-5 w-5 text-[#00B14F]" />
            <span>1900 9217</span>
          </div>
          <span className="text-xs text-gray-500">Tổng đài hỗ trợ: 7AM - 10PM</span>
          
          <a 
            href="mailto:contact@mioto.vn" 
            className="flex items-center gap-2 text-sm text-[#00B14F] hover:underline w-fit font-medium"
          >
            <Mail className="h-4 w-4" />
            <span>contact@mioto.vn</span>
          </a>
          <span className="text-xs text-gray-500">Gửi mail cho Mioto</span>

          {/* Social Icons */}
          <div className="flex gap-4 mt-2">
            <a href="#" className="h-8 w-8 rounded-full bg-gray-100 hover:bg-[#E0F5E9] hover:text-[#00B14F] transition flex items-center justify-center text-gray-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.998 12c0-6.627-5.372-12-11.999-12C5.372 0 0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.61 22.954 24 17.99 24 12z"/>
              </svg>
            </a>
            <a href="#" className="h-8 w-8 rounded-full bg-gray-100 hover:bg-[#E0F5E9] hover:text-[#00B14F] transition flex items-center justify-center text-gray-500 font-bold text-xs">
              TikTok
            </a>
            <a href="#" className="h-8 w-8 rounded-full bg-gray-100 hover:bg-[#E0F5E9] hover:text-[#00B14F] transition flex items-center justify-center text-gray-500 font-bold text-xs">
              Zalo
            </a>
          </div>
        </div>

        {/* Column 2: Policies */}
        <div>
          <h4 className="font-bold text-[15px] text-[#1a1a1a] mb-4">Chính Sách</h4>
          <ul className="flex flex-col gap-2">
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Chính sách & quy định</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Quy chế hoạt động</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Chính sách BVDLCN</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Giải quyết khiếu nại</a></li>
          </ul>
        </div>

        {/* Column 3: Learn More */}
        <div>
          <h4 className="font-bold text-[15px] text-[#1a1a1a] mb-4">Tìm Hiểu Thêm</h4>
          <ul className="flex flex-col gap-2">
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Hướng dẫn chung</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Hướng dẫn đặt xe</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Hướng dẫn thanh toán</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Hỏi và trả lời</a></li>
            <li><a href="https://www.mioto.vn/aboutus" target="_blank" rel="noopener noreferrer" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Về Mioto</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Mioto Blog</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Tuyển dụng</a></li>
          </ul>
        </div>

        {/* Column 4: Partners */}
        <div>
          <h4 className="font-bold text-[15px] text-[#1a1a1a] mb-4">Đối Tác</h4>
          <ul className="flex flex-col gap-2">
            <li><a href="/become-owner" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Đăng ký chủ xe Mioto</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Đăng ký GPS MITRACK 4G</a></li>
            <li><a href="#" className="text-sm text-[#00B14F] hover:underline leading-relaxed block">Đăng ký cho thuê xe dài hạn MICARRO</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#E0E0E0] pt-6 px-6 md:px-12 max-w-7xl mx-auto text-[13px] text-[#6c757d]">
        {/* Row 1 */}
        <div className="flex flex-col md:flex-row justify-between gap-2 mb-4 leading-relaxed">
          <span>© Công ty Cổ phần Mioto Asia</span>
          <span>Số GCNĐKKD: 0317307544 | Ngày cấp: 24-05-22 | Nơi cấp: Sở Kế hoạch và Đầu tư TPHCM</span>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col md:flex-row justify-between gap-2 mb-6 border-t border-gray-100 pt-4">
          <span className="max-w-xl">
            Văn phòng: Lầu 5, Toà nhà Vina Building, 131 Xô Viết Nghệ Tĩnh, Phường 17, Quận Bình Thạnh, TP. Hồ Chí Minh
          </span>
          <span className="text-right">
            TK: 1029384756 (VND) - Công ty Cổ phần Mioto Asia - MB Bank Chi nhánh HCM
          </span>
        </div>

        {/* Row 3 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-gray-100 pt-4">
          {/* Ministry of Industry and Trade registration seal badge */}
          <div className="flex items-center gap-2 bg-[#F9FAF9] border border-[#E0E0E0] px-3 py-1.5 rounded-lg">
            <Shield className="h-5 w-5 text-emerald-600" />
            <span className="font-extrabold text-[10px] text-emerald-800 tracking-wider uppercase">ĐÃ ĐĂNG KÝ BỘ CÔNG THƯƠNG</span>
          </div>

          {/* Payment Methods */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold mr-1">Phương thức thanh toán:</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600">Momo</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600">VNPay</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600">AePay</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600">VISA</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600">ZaloPay</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600">Viettel Money</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
