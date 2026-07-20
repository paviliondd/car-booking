'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, type Booking } from '@/lib/api';
import { Search, Loader2, Calendar, Car, ChevronLeft, MapPin } from 'lucide-react';

export default function TrackPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const results = await api.bookings.track(phone);
      setBookings(results);
      setSearched(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi tra cứu đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded text-xs font-semibold">Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded text-xs font-semibold">Đã xác nhận</span>;
      case 'RENTING':
        return <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded text-xs font-semibold">Đang thuê</span>;
      case 'COMPLETED':
        return <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded text-xs font-semibold">Hoàn thành</span>;
      case 'CANCELLED':
        return <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded text-xs font-semibold">Đã hủy</span>;
      default:
        return null;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return <span className="bg-red-500/15 text-red-400 border border-red-500/10 px-2 py-0.5 rounded text-[10px]">Chưa thanh toán</span>;
      case 'DEPOSITED':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded text-[10px]">Đã đặt cọc</span>;
      case 'PAID':
        return <span className="bg-green-500/15 text-green-400 border border-green-500/10 px-2 py-0.5 rounded text-[10px]">Đã thanh toán</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] py-12 px-6 md:px-12 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header back */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition bg-gray-900/50 px-4 py-2 rounded-lg border border-white/5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Quay lại Trang chủ</span>
        </button>
        <h1 className="text-xl font-bold text-white">Tra cứu đơn hàng đặt xe</h1>
      </div>

      {/* Tra cứu Form */}
      <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-4">
        <p className="text-sm text-gray-400">Vui lòng điền đúng số điện thoại di động bạn đã đăng ký để tra cứu danh sách đơn đặt xe tự lái.</p>
        <form onSubmit={handleTrack} className="flex gap-4 flex-col sm:flex-row">
          <input 
            type="tel" 
            required 
            placeholder="Ví dụ: 0987654321" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-grow bg-gray-950 border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="gradient-btn text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>{loading ? 'Đang tra cứu...' : 'Tìm kiếm đơn'}</span>
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Kết quả */}
      <div className="flex flex-col gap-6">
        {searched && bookings.length === 0 && (
          <div className="glass-panel p-12 text-center text-gray-400 rounded-xl border border-white/5 flex flex-col items-center gap-3">
            <Car className="h-10 w-10 text-gray-600" />
            <p className="font-bold text-white">Không tìm thấy đơn hàng đặt xe nào!</p>
            <p className="text-xs">Vui lòng kiểm tra lại số điện thoại hoặc liên hệ tổng đài 1900 8888 để được hỗ trợ trực tiếp.</p>
          </div>
        )}

        {searched && bookings.length > 0 && bookings.map((b) => (
          <div key={b.id} className="glass-panel rounded-xl overflow-hidden border border-white/5 flex flex-col md:flex-row gap-6 p-6">
            <div className="md:w-1/3 relative h-[140px] rounded-lg overflow-hidden border border-white/10">
              <Image src={b.vehicle!.images[0]} alt={b.vehicle!.model} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
            </div>
            
            <div className="md:w-2/3 flex flex-col gap-4 justify-between">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{b.vehicle!.brand}</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{b.vehicle!.model} <span className="text-xs text-gray-500 font-normal">({b.vehicle!.plateNumber})</span></h3>
                  <span className="text-[11px] text-gray-400 block mt-1">Mã đơn: <strong className="text-emerald-400">{b.bookingNumber}</strong></span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {getStatusBadge(b.status)}
                  {b.payment && getPaymentBadge(b.payment.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 py-3 border-y border-white/5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-gray-500">Nhận xe</span>
                    <strong>{new Date(b.startDate!).toLocaleString('vi-VN')}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-gray-500">Trả xe</span>
                    <strong>{new Date(b.endDate!).toLocaleString('vi-VN')}</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[180px]">{b.pickupLocation}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-[10px]">Tổng thanh toán</span>
                  <span className="text-base font-bold text-emerald-400">{(b.totalPrice).toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
