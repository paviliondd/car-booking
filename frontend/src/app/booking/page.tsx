'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, type AuthUser, type ChatMessage, type Vehicle } from '@/lib/api';
import { io, type Socket } from 'socket.io-client';
import { 
  Car, Calendar, MapPin, User, Phone, 
  CreditCard, Tag, Sparkles, ChevronLeft, Upload, Loader2, CheckCircle2,
  Star, MessageSquare, Send, X, Shield, Map, AlertTriangle
} from 'lucide-react';

const fieldClassName = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:bg-slate-100';
const fieldLabelClassName = 'mb-1.5 block text-sm font-medium text-slate-700';
const panelClassName = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const optionClassName = 'rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-emerald-600/20';
const selectedOptionClassName = 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/15';
const idleOptionClassName = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const threeDaysFromNow = new Date();
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

type VehicleReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer?: { fullName?: string } | null;
};

export default function BookingPage() {
  const router = useRouter();

  // Search States
  const [startDate, setStartDate] = useState(() => tomorrow.toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState(() => threeDaysFromNow.toISOString().slice(0, 10));
  const [endTime, setEndTime] = useState('18:00');
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [suggestions, setSuggestions] = useState<Vehicle[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Booking details states
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idCardNo, setIdCardNo] = useState('');
  const [pickupLoc, setPickupLoc] = useState('Showroom Số 12 Khuất Duy Tiến, Hà Nội');
  const [dropoffLoc, setDropoffLoc] = useState('Showroom Số 12 Khuất Duy Tiến, Hà Nội');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [affiliateCode, setAffiliateCode] = useState('');

  // New features states
  const [insuranceType, setInsuranceType] = useState<'NONE' | 'BASIC' | 'PREMIUM'>('NONE');
  const [depositPercent, setDepositPercent] = useState<30 | 50>(30);
  const [reviewsList, setReviewsList] = useState<VehicleReview[]>([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const chatSocketRef = useRef<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  
  // File Upload State Mocking (lưu base64 hoặc file name để hiển thị)
  const [idCardFront, setIdCardFront] = useState<string | null>(null);
  const [idCardBack, setIdCardBack] = useState<string | null>(null);
  const [driverLicense, setDriverLicense] = useState<string | null>(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.auth.me().then(me => setCurrentUser(me)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      // Load reviews
      api.reviews.findByVehicle(selectedVehicle.id).then((revs) => {
        setReviewsList(revs as VehicleReview[]);
      }).catch(err => console.error(err));
    }
  }, [selectedVehicle]);

  // Chat socket connection
  useEffect(() => {
    if (showChatModal && selectedVehicle?.ownerId && currentUser) {
      api.chat.getHistory(selectedVehicle.ownerId).then((history) => {
        setChatMessages(history);
      });

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
      const socket = io(wsUrl, {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket', 'polling'],
      });
      
      socket.on('messageReceived', (data: ChatMessage) => {
        if (
          (data.senderId === currentUser.id && data.receiverId === selectedVehicle.ownerId) ||
          (data.senderId === selectedVehicle.ownerId && data.receiverId === currentUser.id)
        ) {
          setChatMessages((prev) => [...prev, data]);
        }
      });
      
      chatSocketRef.current = socket;

      return () => {
        socket.disconnect();
        chatSocketRef.current = null;
      };
    }
  }, [showChatModal, selectedVehicle, currentUser]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedVehicle?.ownerId || !currentUser) return;

    const payload = {
      receiverId: selectedVehicle.ownerId,
      message: newChatMessage,
    };

    if (chatSocketRef.current?.connected) {
      chatSocketRef.current.emit('sendMessage', payload);
    } else {
      try {
        const saved = await api.chat.sendMessage(payload.receiverId, payload.message);
        setChatMessages((prev) => [...prev, saved]);
      } catch (err) {
        console.error(err);
      }
    }
    setNewChatMessage('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setErrorMsg('');
    try {
      const startDateTime = `${startDate}T${startTime}:00.000Z`;
      const endDateTime = `${endDate}T${endTime}:00.000Z`;

      const availableCars = await api.vehicles.search(startDateTime, endDateTime);
      setVehicles(availableCars);
      
      if (availableCars.length === 0) {
        const suggs = await api.vehicles.getSuggestions('', 5, startDateTime, endDateTime);
        setSuggestions(suggs);
      }
      setSearched(true);
    } catch (err: unknown) {
      setErrorMsg(errorMessage(err, 'Lỗi tìm xe trống. Vui lòng kiểm tra lại ngày giờ.'));
    } finally {
      setSearching(false);
    }
  };

  const handleFileUploadMock = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'front') setIdCardFront(reader.result as string);
        if (field === 'back') setIdCardBack(reader.result as string);
        if (field === 'license') setDriverLicense(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setBookingLoading(true);
    setErrorMsg('');

    try {
      const startDateTime = `${startDate}T${startTime}:00.000Z`;
      const endDateTime = `${endDate}T${endTime}:00.000Z`;

      const bookingPayload = {
        vehicleId: selectedVehicle.id,
        startDate: startDateTime,
        endDate: endDateTime,
        fullName,
        phone,
        email,
        idCardNo,
        pickupLocation: pickupLoc,
        dropoffLocation: dropoffLoc,
        notes,
        paymentMethod,
        couponCode: couponCode || undefined,
        affiliateCode: affiliateCode || undefined,
        insuranceType,
        depositPercent: Number(depositPercent),
      };

      const result = await api.bookings.create(bookingPayload);
      
      // Chuyển sang trang thanh toán
      const paymentAmount = result.booking.depositAmount ?? result.booking.totalPrice;
      router.push(`/payment?bookingId=${result.booking.id}&paymentUrl=${encodeURIComponent(result.paymentUrl)}&amount=${paymentAmount}&method=${paymentMethod}`);

    } catch (err: unknown) {
      setErrorMsg(errorMessage(err, 'Lỗi trong quá trình đặt xe. Vui lòng kiểm tra lại.'));
    } finally {
      setBookingLoading(false);
    }
  };

  // Tính toán phí bảo hiểm và cọc hiển thị
  const getInsuranceFee = () => {
    if (insuranceType === 'NONE') return 0;
    if (insuranceType === 'BASIC') return 100000;
    return 250000;
  };

  const getDaysCount = () => {
    const s = new Date(`${startDate}T${startTime}:00.000Z`);
    const e = new Date(`${endDate}T${endTime}:00.000Z`);
    const diff = e.getTime() - s.getTime();
    if (diff <= 0) return 1;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getSubTotal = () => {
    if (!selectedVehicle) return 0;
    const days = getDaysCount();
    return selectedVehicle.dailyPrice * days;
  };

  const getTotalPrice = () => {
    if (!selectedVehicle) return 0;
    const days = getDaysCount();
    return getSubTotal() + (getInsuranceFee() * days);
  };

  const getDepositAmount = () => {
    return Math.round(getTotalPrice() * (depositPercent / 100));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {/* Header Back */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <button 
          onClick={() => {
            if (selectedVehicle) setSelectedVehicle(null);
            else router.push('/');
          }}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{selectedVehicle ? 'Quay lại danh sách' : 'Về trang chủ'}</span>
        </button>

        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950">
          <Car className="h-6 w-6 text-emerald-600" />
          <span>Đặt Xe Tự Lái</span>
        </h1>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CHƯA CHỌN XE - HIỂN THỊ TRÌNH TÌM KIẾM XE */}
      {!selectedVehicle && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cột Trái: Bộ tìm kiếm */}
          <div className={`lg:col-span-1 ${panelClassName} flex h-fit flex-col gap-6 p-6`}>
            <h2 className="flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-bold text-slate-950">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <span>Thời Gian & Địa Điểm</span>
            </h2>

            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelClassName}>Ngày Nhận</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className={fieldClassName}
                  />
                </div>
                <div>
                  <label className={fieldLabelClassName}>Giờ Nhận</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelClassName}>Ngày Trả</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className={fieldClassName}
                  />
                </div>
                <div>
                  <label className={fieldLabelClassName}>Giờ Trả</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabelClassName}>Điểm Nhận/Trả Xe</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={pickupLoc}
                    onChange={(e) => { setPickupLoc(e.target.value); setDropoffLoc(e.target.value); }}
                    placeholder="Điểm nhận xe" 
                    required
                    className={`${fieldClassName} pl-10`}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={searching}
                className="gradient-btn mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {searching && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{searching ? 'Đang tìm kiếm...' : 'Tìm Xe Trống'}</span>
              </button>
            </form>
          </div>

          {/* Cột Phải: Danh sách xe trống */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {!searched && (
              <div className={`${panelClassName} flex flex-col items-center gap-4 p-8 text-center text-slate-600 sm:p-12`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <Car className="h-8 w-8 text-emerald-600" aria-hidden="true" />
                </div>
                <p className="text-lg font-bold text-slate-950">Vui lòng chọn lịch trình để tìm xe trống</p>
                <p className="max-w-xl text-sm leading-6">Hệ thống sẽ kiểm tra thời gian và loại bỏ các xe trùng lịch đã được xác nhận cọc.</p>
              </div>
            )}

            {searched && vehicles.length === 0 && (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-bold"><Car className="h-5 w-5" aria-hidden="true" /> Không tìm thấy xe trống theo lịch yêu cầu</h3>
                  <p className="text-sm">Dưới đây là một số dòng xe tương tự hiện đang còn trống lịch ở khoảng thời gian lân cận để bạn tham khảo:</p>
                </div>

                {/* Grid xe gợi ý thay thế */}
                <div className="grid md:grid-cols-2 gap-6">
                  {suggestions.map((car) => (
                    <div key={car.id} className={`${panelClassName} group flex flex-col overflow-hidden`}>
                      <div className="relative h-[160px]">
                        <Image src={car.images[0]} alt={car.model} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                      </div>
                      <div className="p-5 flex flex-col flex-grow gap-3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-slate-950">{car.brand} {car.model}</h3>
                          <span className="font-bold text-emerald-700">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                        </div>
                        <p className="text-xs leading-5 text-slate-600">Năm sản xuất: {car.year} | Ghế: {car.seats} | {car.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</p>
                        <button 
                          onClick={() => setSelectedVehicle(car)}
                          className="mt-2 min-h-11 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:border-emerald-600 hover:bg-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer"
                        >
                          Chọn xe gợi ý này
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searched && vehicles.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {vehicles.map((car) => (
                  <div key={car.id} className={`${panelClassName} group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md motion-reduce:transform-none`}>
                    <div className="relative h-[180px]">
                      <Image src={car.images[0]} alt={car.model} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                      <span className="absolute bottom-3 left-3 bg-[#080b11]/80 text-[#f3f4f6] text-xs font-semibold px-2 py-1 rounded-md border border-white/10">
                        Biển số: {car.plateNumber}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-grow gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-gray-500 block uppercase font-medium">{car.brand}</span>
                          <h3 className="mt-0.5 text-lg font-bold text-slate-950">{car.model}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block">Giá chuẩn</span>
                          <span className="text-base font-bold text-emerald-700">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-lg border-y border-slate-200 bg-slate-50 py-2 text-center text-xs text-slate-700">
                        <div>
                          <span className="block text-slate-500">Ghế</span>
                          <strong>{car.seats} Chỗ</strong>
                        </div>
                        <div>
                          <span className="block text-slate-500">Số</span>
                          <strong>{car.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</strong>
                        </div>
                        <div>
                          <span className="block text-slate-500">Vận hành</span>
                          <strong>{car.fuel === 'ELECTRIC' ? 'Điện' : 'Xăng/Dầu'}</strong>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedVehicle(car)}
                        className="gradient-btn mt-auto min-h-11 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer"
                      >
                        Chọn & Điền hồ sơ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ĐÃ CHỌN XE - HIỂN THỊ HỒ SƠ CHI TIẾT, BẢN ĐỒ VÀ RATING */}
      {selectedVehicle && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cột Trái: Tóm tắt đơn đặt, Bản đồ & Đánh giá */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* 1. Tóm tắt chuyến đi */}
            <div className={`${panelClassName} flex flex-col gap-4 p-6`}>
              <h2 className="border-b border-slate-200 pb-3 text-lg font-bold text-slate-950">Tóm tắt chuyến đi</h2>
              <div className="flex gap-4 items-center">
                <Image
                  src={selectedVehicle.images[0]} 
                  alt={selectedVehicle.model} 
                  width={80}
                  height={64}
                  className="h-16 w-20 rounded-lg border border-slate-200 object-cover"
                />
                <div>
                  <h3 className="font-bold text-slate-950">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                  <p className="text-xs text-slate-600">Biển số: {selectedVehicle.plateNumber}</p>
                </div>
              </div>
              <hr className="border-slate-200" />
              <div className="text-sm space-y-2">
                <div className="flex justify-between gap-3 text-slate-600">
                  <span>Nhận xe:</span>
                  <span className="font-medium text-slate-950">{startDate} | {startTime}</span>
                </div>
                <div className="flex justify-between gap-3 text-slate-600">
                  <span>Trả xe:</span>
                  <span className="font-medium text-slate-950">{endDate} | {endTime}</span>
                </div>
                <div className="flex justify-between gap-3 text-slate-600">
                  <span>Điểm giao nhận:</span>
                  <span className="max-w-[180px] truncate text-right font-medium text-slate-950">{pickupLoc}</span>
                </div>
              </div>
              <hr className="border-slate-200" />
              <div className="text-sm space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng ngày thuê:</span>
                  <span className="font-bold text-slate-950">{getDaysCount()} Ngày</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Giá thuê:</span>
                  <span className="text-slate-950">{(getSubTotal()).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí bảo hiểm:</span>
                  <span className="text-slate-950">{(getInsuranceFee() * getDaysCount()).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-700">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-emerald-700">{(getTotalPrice()).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-base font-black text-emerald-700">
                  <span>Tiền đặt cọc ({depositPercent}%):</span>
                  <span>{(getDepositAmount()).toLocaleString()}đ</span>
                </div>
              </div>

              {currentUser && selectedVehicle.ownerId && (
                <button
                  onClick={() => setShowChatModal(true)}
                  className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-600 hover:bg-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat trực tiếp với chủ xe</span>
                </button>
              )}
            </div>

            {/* 2. Bản đồ tọa độ (Map widget) */}
            <div className={`${panelClassName} flex flex-col gap-4 p-6`}>
              <h3 className="flex items-center gap-2 border-b border-slate-200 pb-2 font-bold text-slate-950">
                <Map className="h-4.5 w-4.5 text-emerald-600" />
                <span>Vị Trí Nhận Xe</span>
              </h3>
              <p className="text-xs text-slate-600">Xe đặt tại tọa độ: Lat {selectedVehicle.latitude || '20.999'}, Lng {selectedVehicle.longitude || '105.798'}</p>
              
              <div className="relative flex h-40 flex-col items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <iframe 
                  src={`https://maps.google.com/maps?q=${selectedVehicle.latitude || 20.9996},${selectedVehicle.longitude || 105.7981}&z=14&output=embed`}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true}
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            {/* 3. Đánh Giá & Nhận Xét */}
            <div className={`${panelClassName} flex flex-col gap-4 p-6`}>
              <h3 className="flex items-center gap-2 border-b border-slate-200 pb-2 font-bold text-slate-950">
                <Star className="h-4.5 w-4.5 text-yellow-400 fill-current" />
                <span>Nhận xét khách hàng ({reviewsList.length})</span>
              </h3>
              {reviewsList.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">Chưa có đánh giá nào cho xe này.</p>
              ) : (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span className="font-bold text-slate-950">{rev.customer?.fullName || 'Khách ẩn danh'}</span>
                        <div className="flex gap-0.5 text-yellow-400">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="leading-relaxed text-slate-700">{rev.comment}</p>
                      <span className="mt-1 block text-right text-[10px] text-slate-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Cột Phải: Form thông tin, Upload tài liệu, Insurance & Deposit */}
          <div className={`lg:col-span-2 ${panelClassName} flex flex-col gap-6 p-6`}>
            <h2 className="border-b border-slate-200 pb-3 text-lg font-bold text-slate-950">Thông Tin Đăng Ký Thuê Xe</h2>

            <form onSubmit={handleBook} className="flex flex-col gap-6">
              
              {/* Form cá nhân */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClassName}>Họ và tên (CCCD)</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={fieldLabelClassName}>Số điện thoại liên lạc</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="tel" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0987654321"
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClassName}>Số Căn cước công dân (CCCD)</label>
                  <input 
                    type="text" 
                    required 
                    value={idCardNo}
                    onChange={(e) => setIdCardNo(e.target.value)}
                    placeholder="037200123456"
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label className={fieldLabelClassName}>Địa chỉ Email nhận hợp đồng</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguyenvana@gmail.com"
                    className={fieldClassName}
                  />
                </div>
              </div>

              {/* 1. Chọn gói Bảo Hiểm */}
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-950">
                  <Shield className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Bảo Hiểm Thân Vỏ Tự Nguyện</span>
                </h3>
                <div className="grid md:grid-cols-3 gap-3">
                  
                  {/* None */}
                  <label className={`${optionClassName} flex cursor-pointer flex-col gap-1 ${insuranceType === 'NONE' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-slate-950">Gói Tiêu chuẩn</span>
                      <input 
                        type="radio" 
                        name="insurance" 
                        checked={insuranceType === 'NONE'}
                        onChange={() => setInsuranceType('NONE')}
                        className="accent-emerald-500"
                      />
                    </div>
                    <span className="text-xs text-slate-600">Khách tự chịu trách nhiệm va chạm</span>
                    <strong className="mt-2 text-xs text-emerald-700">0đ / ngày</strong>
                  </label>

                  {/* Basic */}
                  <label className={`${optionClassName} flex cursor-pointer flex-col gap-1 ${insuranceType === 'BASIC' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-slate-950">Gói Cơ Bản</span>
                      <input 
                        type="radio" 
                        name="insurance" 
                        checked={insuranceType === 'BASIC'}
                        onChange={() => setInsuranceType('BASIC')}
                        className="accent-emerald-500"
                      />
                    </div>
                    <span className="text-xs text-slate-600">Bồi thường va chạm đến 80%</span>
                    <strong className="mt-2 text-xs text-emerald-700">100,000đ / ngày</strong>
                  </label>

                  {/* Premium */}
                  <label className={`${optionClassName} flex cursor-pointer flex-col gap-1 ${insuranceType === 'PREMIUM' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-slate-950">Gói VIP Cao Cấp</span>
                      <input 
                        type="radio" 
                        name="insurance" 
                        checked={insuranceType === 'PREMIUM'}
                        onChange={() => setInsuranceType('PREMIUM')}
                        className="accent-emerald-500"
                      />
                    </div>
                    <span className="text-xs text-slate-600">Bảo hiểm 100% không khấu hao</span>
                    <strong className="mt-2 text-xs text-emerald-700">250,000đ / ngày</strong>
                  </label>
                </div>
              </div>

              {/* 2. Chọn Tỷ Lệ Cọc */}
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-950">
                  <CreditCard className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Chọn Tỷ Lệ Đặt Cọc</span>
                </h3>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setDepositPercent(30)}
                    className={`min-h-11 flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer ${
                      depositPercent === 30 ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/15' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    Cọc trước 30%
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDepositPercent(50)}
                    className={`min-h-11 flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer ${
                      depositPercent === 50 ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/15' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    Cọc trước 50%
                  </button>
                </div>
              </div>

              {/* Upload hồ sơ */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-950">Tài Liệu Hồ Sơ Xác Thực (Bắt buộc)</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-emerald-600 hover:bg-emerald-50/40">
                    {idCardFront ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={idCardFront} alt="CCCD mặt trước" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">CCCD Mặt trước</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUploadMock('front', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>

                  <div className="relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-emerald-600 hover:bg-emerald-50/40">
                    {idCardBack ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={idCardBack} alt="CCCD mặt sau" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">CCCD Mặt sau</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUploadMock('back', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>

                  <div className="relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-emerald-600 hover:bg-emerald-50/40">
                    {driverLicense ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={driverLicense} alt="Giấy phép lái xe" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">Giấy phép lái xe (GPLX)</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUploadMock('license', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>
              </div>

              {/* Coupon, Affiliate & Ghi chú */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClassName}>Mã giảm giá (Coupon)</label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="GIAM50K, CHAOHE2026..."
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={fieldLabelClassName}>Mã người giới thiệu (Affiliate)</label>
                  <div className="relative">
                    <Sparkles className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                      placeholder="CTV999..."
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={fieldLabelClassName}>Ghi chú thêm cho chủ xe</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Yêu cầu giao xe tại cơ quan, vệ sinh sạch sẽ trước khi giao..."
                  className={`${fieldClassName} min-h-24 resize-y`}
                />
              </div>

              {/* Chọn phương thức thanh toán */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-950">Hình Thức Đặt Cọc</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <label className={`${optionClassName} flex min-h-20 cursor-pointer items-center justify-between gap-3 ${paymentMethod === 'BANK_TRANSFER' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 shrink-0 text-emerald-700" />
                      <span className="text-sm font-semibold text-slate-950">VietQR / Ngân Hàng</span>
                    </div>
                    <input 
                      type="radio" 
                      name="payMethod" 
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={() => setPaymentMethod('BANK_TRANSFER')}
                      className="accent-emerald-500" 
                    />
                  </label>

                  <label className={`${optionClassName} flex min-h-20 cursor-pointer items-center justify-between gap-3 ${paymentMethod === 'MOMO' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center">M</div>
                      <span className="text-sm font-semibold text-slate-950">Ví MoMo</span>
                    </div>
                    <input 
                      type="radio" 
                      name="payMethod" 
                      value="MOMO"
                      checked={paymentMethod === 'MOMO'}
                      onChange={() => setPaymentMethod('MOMO')}
                      className="accent-emerald-500" 
                    />
                  </label>

                  <label className={`${optionClassName} flex min-h-20 cursor-pointer items-center justify-between gap-3 ${paymentMethod === 'CASH' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 shrink-0 text-emerald-700" />
                      <span className="text-sm font-semibold text-slate-950">Tiền mặt tại showroom</span>
                    </div>
                    <input 
                      type="radio" 
                      name="payMethod" 
                      value="CASH"
                      checked={paymentMethod === 'CASH'}
                      onChange={() => setPaymentMethod('CASH')}
                      className="accent-emerald-500" 
                    />
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                disabled={bookingLoading}
                className="gradient-btn mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-lg font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {bookingLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                <span>{bookingLoading ? 'Đang khởi tạo đơn hàng...' : 'Xác Nhận Đặt Xe & Cọc'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHAT MODAL CHO KHÁCH HÀNG CHAT VỚI CHỦ XE */}
      {showChatModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex h-[min(500px,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4 font-bold text-slate-950">
              <span>Chat với Chủ xe</span>
              <button 
                onClick={() => setShowChatModal(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
                aria-label="Đóng cửa sổ chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <div className="my-auto text-center text-xs text-slate-500">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.</div>
              ) : (
                chatMessages.map((chat, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[75%] p-3 rounded-xl text-sm ${
                      chat.senderId === currentUser?.id 
                        ? 'bg-emerald-600 text-white self-end rounded-br-none' 
                        : 'self-start rounded-bl-none border border-slate-200 bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p>{chat.message}</p>
                    <span className={`mt-1 block text-right text-[10px] ${chat.senderId === currentUser?.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {new Date(chat.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <input 
                type="text" 
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className={`${fieldClassName} flex-grow`}
              />
              <button 
                type="submit"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer"
                aria-label="Gửi tin nhắn"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      </div>
    </main>
  );
}
