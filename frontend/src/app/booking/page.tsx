'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, type AuthUser, type ChatMessage, type Vehicle } from '@/lib/api';
import { io, type Socket } from 'socket.io-client';
import { 
  Car, Calendar, MapPin, User, Phone, 
  CreditCard, Tag, Sparkles, ChevronLeft, Upload, Loader2, CheckCircle2,
  Star, MessageSquare, Send, X, Shield, Map
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#080b11] py-12 px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header Back */}
      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <button 
          onClick={() => {
            if (selectedVehicle) setSelectedVehicle(null);
            else router.push('/');
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition bg-gray-900/50 px-4 py-2 rounded-lg border border-white/5 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{selectedVehicle ? 'Quay lại danh sách' : 'Về trang chủ'}</span>
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Car className="h-6 w-6 text-emerald-500" />
          <span>Đặt Xe Tự Lái</span>
        </h1>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* CHƯA CHỌN XE - HIỂN THỊ TRÌNH TÌM KIẾM XE */}
      {!selectedVehicle && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cột Trái: Bộ tìm kiếm */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-xl border border-white/5 h-fit flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <span>Thời Gian & Địa Điểm</span>
            </h2>

            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Ngày Nhận</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Giờ Nhận</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Ngày Trả</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Giờ Trả</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Điểm Nhận/Trả Xe</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={pickupLoc}
                    onChange={(e) => { setPickupLoc(e.target.value); setDropoffLoc(e.target.value); }}
                    placeholder="Điểm nhận xe" 
                    required
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={searching}
                className="w-full gradient-btn text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {searching && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{searching ? 'Đang tìm kiếm...' : 'Tìm Xe Trống'}</span>
              </button>
            </form>
          </div>

          {/* Cột Phải: Danh sách xe trống */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {!searched && (
              <div className="glass-panel p-12 text-center rounded-xl border border-white/5 flex flex-col items-center gap-4 text-gray-400">
                <Car className="h-12 w-12 text-emerald-500/50 animate-bounce" />
                <p className="text-lg font-bold text-white">Vui lòng chọn lịch trình để quét tìm xe trống</p>
                <p className="text-sm">Hệ thống sẽ lọc thời gian và loại bỏ ngay lập tức các xe trùng lịch đã được xác nhận cọc.</p>
              </div>
            )}

            {searched && vehicles.length === 0 && (
              <div className="flex flex-col gap-6">
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-6 rounded-xl">
                  <h3 className="font-bold text-lg mb-2">🚗 Không tìm thấy xe trống theo lịch yêu cầu!</h3>
                  <p className="text-sm">Dưới đây là một số dòng xe tương tự hiện đang còn trống lịch ở khoảng thời gian lân cận để bạn tham khảo:</p>
                </div>

                {/* Grid xe gợi ý thay thế */}
                <div className="grid md:grid-cols-2 gap-6">
                  {suggestions.map((car) => (
                    <div key={car.id} className="glass-panel rounded-xl overflow-hidden border border-white/5 flex flex-col group">
                      <div className="relative h-[160px]">
                        <Image src={car.images[0]} alt={car.model} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                      </div>
                      <div className="p-5 flex flex-col flex-grow gap-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-white text-lg">{car.brand} {car.model}</h3>
                          <span className="text-emerald-400 font-bold">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                        </div>
                        <p className="text-xs text-gray-400">Năm sản xuất: {car.year} | Ghế: {car.seats} | {car.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</p>
                        <button 
                          onClick={() => setSelectedVehicle(car)}
                          className="w-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white py-2 rounded-lg text-xs font-bold transition mt-2 cursor-pointer"
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
                  <div key={car.id} className="glass-panel rounded-xl overflow-hidden border border-white/5 flex flex-col group hover:border-emerald-500/20 transition-all duration-300">
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
                          <h3 className="text-lg font-bold text-white mt-0.5">{car.model}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block">Giá chuẩn</span>
                          <span className="text-base font-bold text-emerald-400">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-xs text-gray-400 text-center bg-white/1 rounded-lg">
                        <div>
                          <span className="block text-gray-500">Ghế</span>
                          <strong>{car.seats} Chỗ</strong>
                        </div>
                        <div>
                          <span className="block text-gray-500">Số</span>
                          <strong>{car.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</strong>
                        </div>
                        <div>
                          <span className="block text-gray-500">Vận hành</span>
                          <strong>{car.fuel === 'ELECTRIC' ? 'Điện' : 'Xăng/Dầu'}</strong>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedVehicle(car)}
                        className="w-full gradient-btn text-white py-2.5 rounded-lg text-sm font-semibold transition mt-auto cursor-pointer"
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
            <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Tóm tắt chuyến đi</h2>
              <div className="flex gap-4 items-center">
                <Image
                  src={selectedVehicle.images[0]} 
                  alt={selectedVehicle.model} 
                  width={80}
                  height={64}
                  className="w-20 h-16 object-cover rounded-lg border border-white/10" 
                />
                <div>
                  <h3 className="font-bold text-white">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                  <p className="text-xs text-gray-400">Biển số: {selectedVehicle.plateNumber}</p>
                </div>
              </div>
              <hr className="border-white/5" />
              <div className="text-sm space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Nhận xe:</span>
                  <span className="text-white font-medium">{startDate} | {startTime}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Trả xe:</span>
                  <span className="text-white font-medium">{endDate} | {endTime}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Điểm giao nhận:</span>
                  <span className="text-white font-medium text-right max-w-[180px] truncate">{pickupLoc}</span>
                </div>
              </div>
              <hr className="border-white/5" />
              <div className="text-sm space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Tổng ngày thuê:</span>
                  <span className="text-white font-bold">{getDaysCount()} Ngày</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Giá thuê:</span>
                  <span className="text-white">{(getSubTotal()).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Phí bảo hiểm:</span>
                  <span className="text-white">{(getInsuranceFee() * getDaysCount()).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-gray-500 font-bold border-t border-white/5 pt-2">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-emerald-400">{(getTotalPrice()).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-green-400 font-black text-base">
                  <span>Tiền đặt cọc ({depositPercent}%):</span>
                  <span>{(getDepositAmount()).toLocaleString()}đ</span>
                </div>
              </div>

              {currentUser && selectedVehicle.ownerId && (
                <button
                  onClick={() => setShowChatModal(true)}
                  className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-2.5 rounded-lg text-sm font-semibold transition mt-2 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/20"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat trực tiếp với chủ xe</span>
                </button>
              )}
            </div>

            {/* 2. Bản đồ tọa độ (Map widget) */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                <Map className="h-4.5 w-4.5 text-emerald-400" />
                <span>Vị Trí Nhận Xe</span>
              </h3>
              <p className="text-xs text-gray-400">Xe đặt tại tọa độ: Lat {selectedVehicle.latitude || '20.999'}, Lng {selectedVehicle.longitude || '105.798'}</p>
              
              <div className="rounded-lg overflow-hidden border border-white/10 h-40 bg-gray-950 flex flex-col items-center justify-center relative">
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
            <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-4">
              <h3 className="font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                <Star className="h-4.5 w-4.5 text-yellow-400 fill-current" />
                <span>Nhận xét khách hàng ({reviewsList.length})</span>
              </h3>
              {reviewsList.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Chưa có đánh giá nào cho xe này.</p>
              ) : (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="p-3 rounded bg-white/2 border border-white/5 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span className="font-bold text-white">{rev.customer?.fullName || 'Khách ẩn danh'}</span>
                        <div className="flex gap-0.5 text-yellow-400">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{rev.comment}</p>
                      <span className="text-[10px] text-gray-500 block text-right mt-1">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Cột Phải: Form thông tin, Upload tài liệu, Insurance & Deposit */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Thông Tin Đăng Ký Thuê Xe</h2>

            <form onSubmit={handleBook} className="flex flex-col gap-6">
              
              {/* Form cá nhân */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Họ và tên (CCCD)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Số điện thoại liên lạc</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input 
                      type="tel" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0987654321"
                      className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Số Căn cước công dân (CCCD)</label>
                  <input 
                    type="text" 
                    required 
                    value={idCardNo}
                    onChange={(e) => setIdCardNo(e.target.value)}
                    placeholder="037200123456"
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Địa chỉ Email nhận hợp đồng</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguyenvana@gmail.com"
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              {/* 1. Chọn gói Bảo Hiểm */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                  <Shield className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Bảo Hiểm Thân Vỏ Tự Nguyện</span>
                </h3>
                <div className="grid md:grid-cols-3 gap-3">
                  
                  {/* None */}
                  <label className={`border rounded-lg p-4 flex flex-col gap-1 cursor-pointer transition ${insuranceType === 'NONE' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-white">Gói Tiêu chuẩn</span>
                      <input 
                        type="radio" 
                        name="insurance" 
                        checked={insuranceType === 'NONE'}
                        onChange={() => setInsuranceType('NONE')}
                        className="accent-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">Khách tự chịu trách nhiệm va chạm</span>
                    <strong className="text-xs text-emerald-400 mt-2">0đ / ngày</strong>
                  </label>

                  {/* Basic */}
                  <label className={`border rounded-lg p-4 flex flex-col gap-1 cursor-pointer transition ${insuranceType === 'BASIC' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-white">Gói Cơ Bản</span>
                      <input 
                        type="radio" 
                        name="insurance" 
                        checked={insuranceType === 'BASIC'}
                        onChange={() => setInsuranceType('BASIC')}
                        className="accent-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">Bồi thường va chạm đến 80%</span>
                    <strong className="text-xs text-emerald-400 mt-2">100,000đ / ngày</strong>
                  </label>

                  {/* Premium */}
                  <label className={`border rounded-lg p-4 flex flex-col gap-1 cursor-pointer transition ${insuranceType === 'PREMIUM' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-white">Gói VIP Cao Cấp</span>
                      <input 
                        type="radio" 
                        name="insurance" 
                        checked={insuranceType === 'PREMIUM'}
                        onChange={() => setInsuranceType('PREMIUM')}
                        className="accent-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">Bảo hiểm 100% không khấu hao</span>
                    <strong className="text-xs text-emerald-400 mt-2">250,000đ / ngày</strong>
                  </label>
                </div>
              </div>

              {/* 2. Chọn Tỷ Lệ Cọc */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                  <CreditCard className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Chọn Tỷ Lệ Đặt Cọc</span>
                </h3>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setDepositPercent(30)}
                    className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition border cursor-pointer ${
                      depositPercent === 30 ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/10 text-gray-400 bg-gray-950 hover:border-white/20'
                    }`}
                  >
                    Cọc trước 30%
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDepositPercent(50)}
                    className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition border cursor-pointer ${
                      depositPercent === 50 ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/10 text-gray-400 bg-gray-950 hover:border-white/20'
                    }`}
                  >
                    Cọc trước 50%
                  </button>
                </div>
              </div>

              {/* Upload hồ sơ */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Tài Liệu Hồ Sơ Xác Thực (Bắt buộc)</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-dashed border-white/10 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 transition relative">
                    {idCardFront ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={idCardFront} alt="CCCD mặt trước" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-500" />
                        <span className="text-[11px] text-gray-400 font-medium">CCCD Mặt trước</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUploadMock('front', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>

                  <div className="border border-dashed border-white/10 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 transition relative">
                    {idCardBack ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={idCardBack} alt="CCCD mặt sau" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-500" />
                        <span className="text-[11px] text-gray-400 font-medium">CCCD Mặt sau</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUploadMock('back', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>

                  <div className="border border-dashed border-white/10 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 transition relative">
                    {driverLicense ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={driverLicense} alt="Giấy phép lái xe" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-500" />
                        <span className="text-[11px] text-gray-400 font-medium">Giấy phép lái xe (GPLX)</span>
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
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Mã giảm giá (Coupon)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="GIAM50K, CHAOHE2026..."
                      className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Mã người giới thiệu (Affiliate)</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input 
                      type="text" 
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                      placeholder="CTV999..."
                      className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Ghi chú thêm cho chủ xe</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Yêu cầu giao xe tại cơ quan, vệ sinh sạch sẽ trước khi giao..."
                  className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              {/* Chọn phương thức thanh toán */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Hình Thức Đặt Cọc</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <label className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition ${paymentMethod === 'BANK_TRANSFER' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm font-semibold text-white">VietQR / Ngân Hàng</span>
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

                  <label className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition ${paymentMethod === 'MOMO' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center">M</div>
                      <span className="text-sm font-semibold text-white">Ví MoMo</span>
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

                  <label className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-semibold text-white">Tiền mặt tại showroom</span>
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
                className="w-full gradient-btn text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 mt-4 cursor-pointer text-lg disabled:opacity-50"
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
          <div className="w-full max-w-md bg-[#0b0f19] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-gray-950 flex justify-between items-center text-white font-bold">
              <span>Chat với Chủ xe</span>
              <button 
                onClick={() => setShowChatModal(false)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <div className="text-xs text-gray-500 text-center my-auto">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.</div>
              ) : (
                chatMessages.map((chat, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[75%] p-3 rounded-xl text-sm ${
                      chat.senderId === currentUser?.id 
                        ? 'bg-emerald-600 text-white self-end rounded-br-none' 
                        : 'bg-white/5 text-gray-300 self-start rounded-bl-none border border-white/5'
                    }`}
                  >
                    <p>{chat.message}</p>
                    <span className="text-[8px] text-gray-400 block mt-1 text-right">
                      {new Date(chat.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-white/5 flex gap-2 bg-gray-950/40">
              <input 
                type="text" 
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-grow bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 text-white" 
              />
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
