'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, type Booking } from '@/lib/api';
import { Search, Loader2, Calendar, Car, ChevronLeft, MapPin } from 'lucide-react';

export default function TrackPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const results = await api.bookings.track(phone, bookingCode);
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
        return <span className="bg-warning-muted border border-warning/35 text-warning px-2.5 py-1 rounded text-xs font-semibold">Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="bg-utility border border-brand/35 text-brand px-2.5 py-1 rounded text-xs font-semibold">Đã xác nhận</span>;
      case 'RENTING':
        return <span className="bg-utility border border-brand/35 text-brand px-2.5 py-1 rounded text-xs font-semibold">Đang thuê</span>;
      case 'COMPLETED':
        return <span className="bg-brand/10 border border-brand/35 text-brand px-2.5 py-1 rounded text-xs font-semibold">Hoàn thành</span>;
      case 'CANCELLED':
        return <span className="bg-danger-muted border border-danger/35 text-danger px-2.5 py-1 rounded text-xs font-semibold">Đã hủy</span>;
      default:
        return null;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return <span className="bg-danger-muted text-danger border border-danger/25 px-2 py-0.5 rounded text-[10px]">Chưa thanh toán</span>;
      case 'DEPOSITED':
        return <span className="bg-utility text-brand border border-brand/25 px-2 py-0.5 rounded text-[10px]">Đã đặt cọc</span>;
      case 'PAID':
        return <span className="bg-brand/15 text-brand border border-brand/25 px-2 py-0.5 rounded text-[10px]">Đã thanh toán</span>;
      default:
        return null;
    }
  };

  return (
    <div className="dark min-h-screen bg-night-surface py-12 px-6 md:px-12 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header back */}
      <div className="flex items-center justify-between border-b border-app-border/30 pb-6">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-content-secondary hover:text-night-content transition bg-app-muted/70 px-4 py-2 rounded-lg border border-app-border/30"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Quay lại Trang chủ</span>
        </button>
        <h1 className="text-xl font-bold text-night-content">Tra cứu đơn hàng đặt xe</h1>
      </div>

      {/* Tra cứu Form */}
      <div className="glass-panel p-6 rounded-xl border border-app-border/30 flex flex-col gap-4">
        <p className="text-sm text-content-secondary">Nhập mã đơn và số điện thoại đã dùng khi đặt xe.</p>
        <form onSubmit={handleTrack} className="flex gap-4 flex-col sm:flex-row">
          <input type="text" required placeholder="Mã đơn BK-..." value={bookingCode} onChange={(e) => setBookingCode(e.target.value)} className="flex-grow bg-app-surface border border-app-border/70 rounded-lg py-2.5 px-4 text-sm text-content placeholder:text-content-secondary focus:outline-none focus:border-brand" />
          <input 
            type="tel" 
            required 
            placeholder="Ví dụ: 0987654321" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-grow bg-app-surface border border-app-border/50 rounded-lg py-2.5 px-4 text-sm text-content placeholder:text-content-secondary focus:outline-none focus:border-brand"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="gradient-btn text-on-brand px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>{loading ? 'Đang tra cứu...' : 'Tìm kiếm đơn'}</span>
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="bg-danger-muted border border-danger/35 text-danger p-4 rounded-xl text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Kết quả */}
      <div className="flex flex-col gap-6">
        {searched && bookings.length === 0 && (
          <div className="glass-panel p-12 text-center text-content-secondary rounded-xl border border-app-border/30 flex flex-col items-center gap-3">
            <Car className="h-10 w-10 text-content-secondary" />
            <p className="font-bold text-night-content">Không tìm thấy đơn hàng đặt xe nào!</p>
            <p className="text-xs">Vui lòng kiểm tra lại số điện thoại hoặc liên hệ tổng đài 1900 8888 để được hỗ trợ trực tiếp.</p>
          </div>
        )}

        {searched && bookings.length > 0 && bookings.map((b) => (
          <div key={b.id} className="glass-panel rounded-xl overflow-hidden border border-app-border/30 flex flex-col md:flex-row gap-6 p-6">
            <div className="md:w-1/3 relative h-[140px] rounded-lg overflow-hidden border border-app-border/50">
              <Image src={b.vehicle!.images[0]} alt={b.vehicle!.model} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
            </div>
            
            <div className="md:w-2/3 flex flex-col gap-4 justify-between">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] text-content-secondary uppercase tracking-widest font-semibold">{b.vehicle!.brand}</span>
                  <h3 className="text-lg font-bold text-night-content mt-0.5">{b.vehicle!.model} <span className="text-xs text-content-secondary font-normal">({b.vehicle!.plateNumber})</span></h3>
                  <span className="text-[11px] text-content-secondary block mt-1">Mã đơn: <strong className="text-brand">{b.bookingNumber}</strong></span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {getStatusBadge(b.status)}
                  {b.payment && getPaymentBadge(b.payment.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-content-secondary py-3 border-y border-app-border/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-content-secondary">Nhận xe</span>
                    <strong>{new Date(b.startDate!).toLocaleString('vi-VN')}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] text-content-secondary">Trả xe</span>
                    <strong>{new Date(b.endDate!).toLocaleString('vi-VN')}</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-content-secondary">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[180px]">{b.pickupLocation}</span>
                </div>
                <div className="text-right">
                  <span className="text-content-secondary block text-[10px]">Tổng thanh toán</span>
                  <span className="text-base font-bold text-brand">{(b.totalPrice).toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
