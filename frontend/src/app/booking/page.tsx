'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Car, Calendar, MapPin, User, Phone, 
  CreditCard, Tag, Sparkles, ChevronLeft, Upload, Loader2, CheckCircle2 
} from 'lucide-react';

export default function BookingPage() {
  const router = useRouter();

  // Search States
  const [startDate, setStartDate] = useState('2026-06-25');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('2026-06-27');
  const [endTime, setEndTime] = useState('18:00');
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Booking details states
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
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
  
  // File Upload State Mocking (lưu base64 hoặc file name để hiển thị)
  const [idCardFront, setIdCardFront] = useState<string | null>(null);
  const [idCardBack, setIdCardBack] = useState<string | null>(null);
  const [driverLicense, setDriverLicense] = useState<string | null>(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setErrorMsg('');
    try {
      const startDateTime = `${startDate}T${startTime}:00.000Z`;
      const endDateTime = `${endDate}T${endTime}:00.000Z`;

      const availableCars = await api.vehicles.search(startDateTime, endDateTime);
      setVehicles(availableCars);
      
      // Nếu không có xe nào trống, lấy xe gợi ý tương tự
      if (availableCars.length === 0) {
        const suggs = await api.vehicles.getSuggestions('', 5, startDateTime, endDateTime);
        setSuggestions(suggs);
      }
      setSearched(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tìm xe trống. Vui lòng kiểm tra lại ngày giờ.');
    } finally {
      setSearching(false);
    }
  };

  const handleFileUploadMock = (field: string, e: any) => {
    const file = e.target.files[0];
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
      };

      const result = await api.bookings.create(bookingPayload);
      
      // Chuyển sang trang thanh toán
      router.push(`/payment?bookingId=${result.booking.id}&paymentUrl=${encodeURIComponent(result.paymentUrl)}&amount=${result.booking.totalPrice}&method=${paymentMethod}`);

    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi trong quá trình đặt xe. Vui lòng kiểm tra lại.');
    } finally {
      setBookingLoading(false);
    }
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
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition bg-gray-900/50 px-4 py-2 rounded-lg border border-white/5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{selectedVehicle ? 'Quay lại danh sách' : 'Về trang chủ'}</span>
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Car className="h-6 w-6 text-purple-500" />
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
              <Calendar className="h-5 w-5 text-purple-400" />
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
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Giờ Nhận</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500" 
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
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Giờ Trả</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500" 
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
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-purple-500" 
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
                <Car className="h-12 w-12 text-purple-500/50 animate-bounce" />
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
                        <img src={car.images[0]} alt={car.model} className="object-cover w-full h-full" />
                      </div>
                      <div className="p-5 flex flex-col flex-grow gap-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-white text-lg">{car.brand} {car.model}</h3>
                          <span className="text-purple-400 font-bold">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                        </div>
                        <p className="text-xs text-gray-400">Năm sản xuất: {car.year} | Ghế: {car.seats} | {car.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</p>
                        <button 
                          onClick={() => setSelectedVehicle(car)}
                          className="w-full bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white py-2 rounded-lg text-xs font-bold transition mt-2 cursor-pointer"
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
                  <div key={car.id} className="glass-panel rounded-xl overflow-hidden border border-white/5 flex flex-col group hover:border-purple-500/20 transition-all duration-300">
                    <div className="relative h-[180px]">
                      <img src={car.images[0]} alt={car.model} className="object-cover w-full h-full" />
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
                          <span className="text-base font-bold text-purple-400">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
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

      {/* ĐÃ CHỌN XE - HIỂN THỊ FORM ĐIỀN THÔNG TIN ĐẶT XE & HỒ SƠ */}
      {selectedVehicle && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cột Trái: Tóm tắt đơn đặt */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Tóm tắt chuyến đi</h2>
              <div className="flex gap-4 items-center">
                <img 
                  src={selectedVehicle.images[0]} 
                  alt={selectedVehicle.model} 
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
                  <span>Giá thuê/ngày:</span>
                  <span className="text-white">{(selectedVehicle.dailyPrice).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Giá cuối tuần:</span>
                  <span className="text-white">{(selectedVehicle.weekendPrice).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Giá ngày lễ:</span>
                  <span className="text-white">{(selectedVehicle.holidayPrice).toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột Phải: Form thông tin, Upload tài liệu & Thanh toán */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-white/5">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3 mb-6">Thông Tin Khách Thuê & Hồ Sơ</h2>

            <form onSubmit={handleBook} className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Họ và tên (như trên CCCD)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-purple-500" 
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
                      className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-purple-500" 
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
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500" 
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
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500" 
                  />
                </div>
              </div>

              {/* Upload hồ sơ */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Tài Liệu Hồ Sơ Xác Thực (Bắt buộc)</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* CCCD Trước */}
                  <div className="border border-dashed border-white/10 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 transition relative">
                    {idCardFront ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <img src={idCardFront} alt="CCCD Front" className="w-full h-full object-cover" />
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

                  {/* CCCD Sau */}
                  <div className="border border-dashed border-white/10 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 transition relative">
                    {idCardBack ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <img src={idCardBack} alt="CCCD Back" className="w-full h-full object-cover" />
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

                  {/* GPLX */}
                  <div className="border border-dashed border-white/10 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 transition relative">
                    {driverLicense ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <img src={driverLicense} alt="GPLX" className="w-full h-full object-cover" />
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
                      className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-purple-500" 
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
                      className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-purple-500" 
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
                  className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500" 
                />
              </div>

              {/* Chọn phương thức thanh toán */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Hình Thức Đặt Cọc</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {/* VietQR */}
                  <label className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition ${paymentMethod === 'BANK_TRANSFER' ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-purple-400" />
                      <span className="text-sm font-semibold text-white">VietQR / Ngân Hàng</span>
                    </div>
                    <input 
                      type="radio" 
                      name="payMethod" 
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={() => setPaymentMethod('BANK_TRANSFER')}
                      className="accent-purple-500" 
                    />
                  </label>

                  {/* MoMo */}
                  <label className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition ${paymentMethod === 'MOMO' ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
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
                      className="accent-purple-500" 
                    />
                  </label>

                  {/* Tiền mặt */}
                  <label className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition ${paymentMethod === 'CASH' ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/20 bg-gray-950'}`}>
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
                      className="accent-purple-500" 
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
    </div>
  );
}
