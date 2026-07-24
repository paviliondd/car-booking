'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api, type AuthUser, type BookingQuote, type ChatMessage, type CustomerDocumentKeys, type Vehicle } from '@/lib/api';
import { rentalPolicies, storeInfo } from '@/lib/store';
import { vehicleFuelLabel, vehicleTransmissionLabel } from '@/lib/vehicle-labels';
import { io, type Socket } from 'socket.io-client';
import {
  Car, Calendar, MapPin, User, Phone,
  CreditCard, Tag, Sparkles, ChevronLeft, Upload, Loader2, CheckCircle2,
  Star, MessageSquare, Send, X, Shield, Map, AlertTriangle, CalendarRange
} from 'lucide-react';
import VehicleAvailabilityDialog from '@/components/vehicles/VehicleAvailabilityDialog';

const fieldClassName = 'min-h-11 w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-content shadow-sm outline-none transition placeholder:text-content-secondary hover:border-app-border focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-app-muted';
const fieldLabelClassName = 'mb-1.5 block text-sm font-medium text-content-secondary';
const panelClassName = 'rounded-2xl border border-app-border/35 bg-app-surface shadow-sm';
const optionClassName = 'rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-brand/20';
const selectedOptionClassName = 'border-brand bg-utility ring-1 ring-brand/15';
const idleOptionClassName = 'border-app-border/35 bg-app-surface hover:border-app-border hover:bg-app-muted';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const todayInVietnam = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

type VehicleReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer?: { fullName?: string } | null;
};

export default function BookingPage() {
  const router = useRouter();
  const todayDate = todayInVietnam();

  // Search States
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [suggestions, setSuggestions] = useState<Vehicle[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Booking details states
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quoteKey, setQuoteKey] = useState('');
  const [quoteErrorKey, setQuoteErrorKey] = useState('');
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idCardNo, setIdCardNo] = useState('');
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

  // Tệp mới chỉ dùng để xem trước; storage key đã lưu được lấy từ hồ sơ thật.
  const [idCardFront, setIdCardFront] = useState<string | null>(null);
  const [idCardBack, setIdCardBack] = useState<string | null>(null);
  const [driverLicense, setDriverLicense] = useState<string | null>(null);
  const [idCardFrontFile, setIdCardFrontFile] = useState<File | null>(null);
  const [idCardBackFile, setIdCardBackFile] = useState<File | null>(null);
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);
  const [storedDocuments, setStoredDocuments] = useState<CustomerDocumentKeys>({
    idCardFront: null,
    idCardBack: null,
    driverLicense: null,
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const quoteInputValid = Boolean(
    selectedVehicle &&
    startDate &&
    endDate &&
    startTime &&
    endTime &&
    new Date(`${startDate}T${startTime}:00+07:00`) <
      new Date(`${endDate}T${endTime}:00+07:00`),
  );
  const quoteRequestKey = selectedVehicle
    ? [
        selectedVehicle.id,
        startDate,
        startTime,
        endDate,
        endTime,
        insuranceType,
        depositPercent,
        couponCode.trim(),
      ].join("|")
    : "";
  const activeQuote =
    quoteInputValid && quoteKey === quoteRequestKey ? quote : null;
  const activeQuoteError =
    quoteInputValid && quoteErrorKey === quoteRequestKey ? quoteError : "";
  const activeQuoteLoading = quoteInputValid && quoteLoading;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      Promise.all([api.auth.me(), api.account.profile()])
        .then(([me, profile]) => {
          setCurrentUser(me);
          setFullName(profile.name);
          setPhone(profile.phone || '');
          setEmail(profile.email || '');
          setIdCardNo(profile.idCardNo || '');
          setStoredDocuments(profile.documents);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const applyDateTime = (value: string | null, setDate: (next: string) => void, setTime: (next: string) => void) => {
      if (!value) return;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return;
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      const hours = String(parsed.getHours()).padStart(2, '0');
      const minutes = String(parsed.getMinutes()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setTime(`${hours}:${minutes}`);
    };
    applyDateTime(searchParams.get('startDate'), setStartDate, setStartTime);
    applyDateTime(searchParams.get('endDate'), setEndDate, setEndTime);

    const vehicleId = searchParams.get('vehicleId');
    if (!vehicleId) return;
    api.vehicles.findOne(vehicleId)
      .then((vehicle) => {
        setSelectedVehicle(vehicle);
      })
      .catch((err: unknown) => setErrorMsg(errorMessage(err, 'Không thể tải xe đã chọn.')));
  }, []);

  useEffect(() => {
    if (!selectedVehicle || !quoteInputValid) return;
    const requestKey = quoteRequestKey;
    let active = true;
    const timer = window.setTimeout(() => {
      setQuoteLoading(true);
      setQuoteError('');
      setQuoteErrorKey('');
      api.bookings.quote({
        vehicleId: selectedVehicle.id,
        startDate: `${startDate}T${startTime}:00+07:00`,
        endDate: `${endDate}T${endTime}:00+07:00`,
        insuranceType,
        depositPercent,
        couponCode: couponCode.trim() || undefined,
      }).then((nextQuote) => {
        if (!active) return;
        setQuote(nextQuote);
        setQuoteKey(requestKey);
      })
        .catch((err: unknown) => {
          if (!active) return;
          setQuote(null);
          setQuoteKey('');
          setQuoteError(errorMessage(err, 'Không thể cập nhật báo giá.'));
          setQuoteErrorKey(requestKey);
        })
        .finally(() => {
          if (active) setQuoteLoading(false);
        });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [couponCode, depositPercent, endDate, endTime, insuranceType, quoteInputValid, quoteRequestKey, selectedVehicle, startDate, startTime]);

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
      const startDateTime = `${startDate}T${startTime}:00+07:00`;
      const endDateTime = `${endDate}T${endTime}:00+07:00`;

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

  const handleFileUpload = (field: 'front' | 'back' | 'license', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg('Mỗi tệp hồ sơ không được vượt quá 8 MB.');
        return;
      }
      if (field === 'front') setIdCardFrontFile(file);
      if (field === 'back') setIdCardBackFile(file);
      if (field === 'license') setDriverLicenseFile(file);
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
      if (!localStorage.getItem('token')) {
        setErrorMsg('Vui lòng đăng nhập tài khoản khách hàng trước khi đặt xe.');
        return;
      }
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF') {
        setErrorMsg('Tài khoản quản trị không thể tạo đơn thuê. Vui lòng dùng tài khoản khách hàng hoặc chủ xe.');
        return;
      }
      if (
        (!idCardFrontFile && !storedDocuments.idCardFront) ||
        (!idCardBackFile && !storedDocuments.idCardBack) ||
        (!driverLicenseFile && !storedDocuments.driverLicense)
      ) {
        setErrorMsg('Vui lòng tải đủ ảnh CCCD mặt trước, mặt sau và giấy phép lái xe.');
        return;
      }
      if (!acceptedPolicies) {
        setErrorMsg('Vui lòng đọc và đồng ý với quy định thuê xe trước khi xác nhận.');
        return;
      }
      if (!activeQuote) {
        setErrorMsg('Báo giá chưa sẵn sàng. Vui lòng kiểm tra lại lịch thuê.');
        return;
      }

      const uploadedKeys =
        idCardFrontFile || idCardBackFile || driverLicenseFile
          ? await api.storage.uploadCustomerDocuments({
              ...(idCardFrontFile ? { idCardFront: idCardFrontFile } : {}),
              ...(idCardBackFile ? { idCardBack: idCardBackFile } : {}),
              ...(driverLicenseFile
                ? { driverLicense: driverLicenseFile }
                : {}),
            })
          : storedDocuments;
      const documentKeys = {
        idCardFront:
          uploadedKeys.idCardFront || storedDocuments.idCardFront,
        idCardBack: uploadedKeys.idCardBack || storedDocuments.idCardBack,
        driverLicense:
          uploadedKeys.driverLicense || storedDocuments.driverLicense,
      };
      const startDateTime = `${startDate}T${startTime}:00+07:00`;
      const endDateTime = `${endDate}T${endTime}:00+07:00`;

      const bookingPayload = {
        vehicleId: selectedVehicle.id,
        startDate: startDateTime,
        endDate: endDateTime,
        fullName,
        phone,
        email,
        idCardNo,
        notes,
        paymentMethod,
        couponCode: couponCode || undefined,
        affiliateCode: affiliateCode || undefined,
        insuranceType,
        depositPercent: Number(depositPercent),
        idCardFront: documentKeys.idCardFront || undefined,
        idCardBack: documentKeys.idCardBack || undefined,
        driverLicense: documentKeys.driverLicense || undefined,
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

  return (
    <main className="min-h-screen bg-app-muted px-4 py-8 text-content sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {/* Header Back */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-app-border/35 pb-6 sm:flex-row sm:items-center">
        <button
          onClick={() => {
            if (selectedVehicle) setSelectedVehicle(null);
            else router.push('/');
          }}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-content-secondary shadow-sm transition hover:border-app-border hover:bg-app-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{selectedVehicle ? 'Quay lại danh sách' : 'Về trang chủ'}</span>
        </button>

        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-content">
          <Car className="h-6 w-6 text-brand" />
          <span>Đặt Xe Tự Lái</span>
        </h1>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-muted p-4 text-sm text-danger" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CHƯA CHỌN XE - HIỂN THỊ TRÌNH TÌM KIẾM XE */}
      {!selectedVehicle && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cột Trái: Bộ tìm kiếm */}
          <div className={`lg:col-span-1 ${panelClassName} flex h-fit flex-col gap-6 p-6`}>
            <h2 className="flex items-center gap-2 border-b border-app-border/35 pb-3 text-lg font-bold text-content">
              <Calendar className="h-5 w-5 text-brand" />
              <span>Thời Gian & Địa Điểm</span>
            </h2>

            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelClassName}>Ngày Nhận</label>
                  <input
                    type="date"
                    value={startDate}
                    min={todayDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStartDate(value);
                      if (endDate && endDate < value) setEndDate('');
                    }}
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
                    min={startDate || todayDate}
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

              <div className="rounded-xl border border-brand/30 bg-utility p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-brand"><MapPin className="h-4 w-4" />{storeInfo.serviceArea}</p>
                <p className="mt-1 text-xs leading-5 text-brand">{storeInfo.address} · {storeInfo.hours}</p>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="gradient-btn mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-on-brand shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {searching && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{searching ? 'Đang tìm kiếm...' : 'Tìm Xe Trống'}</span>
              </button>
            </form>
          </div>

          {/* Cột Phải: Danh sách xe trống */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {!searched && (
              <div className={`${panelClassName} flex flex-col items-center gap-4 p-8 text-center text-content-secondary sm:p-12`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-utility">
                  <Car className="h-8 w-8 text-brand" aria-hidden="true" />
                </div>
                <p className="text-lg font-bold text-content">Vui lòng chọn lịch trình để tìm xe trống</p>
                <p className="max-w-xl text-sm leading-6">Hệ thống sẽ kiểm tra thời gian và loại bỏ các xe trùng lịch đã được xác nhận cọc.</p>
              </div>
            )}

            {searched && vehicles.length === 0 && (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-warning/30 bg-warning-muted p-6 text-warning">
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-bold"><Car className="h-5 w-5" aria-hidden="true" /> Không tìm thấy xe trống theo lịch yêu cầu</h3>
                  <p className="text-sm">Dưới đây là một số dòng xe tương tự hiện đang còn trống lịch ở khoảng thời gian lân cận để bạn tham khảo:</p>
                </div>

                {/* Grid xe gợi ý thay thế */}
                <div className="grid md:grid-cols-2 gap-6">
                  {suggestions.map((car) => (
                    <div key={car.id} className={`${panelClassName} group flex flex-col overflow-hidden`}>
                      <div className="relative h-[160px]">
                        {car.images[0] ? <Image src={car.images[0]} alt={car.model} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /> : <div className="flex h-full items-center justify-center bg-app-muted"><Car className="h-12 w-12 text-content-secondary" /></div>}
                      </div>
                      <div className="p-5 flex flex-col flex-grow gap-3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-content">{car.brand} {car.model}</h3>
                          <span className="font-bold text-rental-price">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                        </div>
                        <p className="text-xs leading-5 text-content-secondary">Năm sản xuất: {car.year} | Ghế: {car.seats} | {car.transmission === 'AUTO' ? 'Tự động' : 'Số sàn'}</p>
                        <button
                          onClick={() => setSelectedVehicle(car)}
                          className="mt-2 min-h-11 w-full rounded-lg border border-brand/30 bg-utility px-4 py-2 text-sm font-bold text-brand transition hover:border-brand hover:bg-brand hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
                        >
                          Chọn xe gợi ý này
                        </button>
                        <Link href={`/vehicles/${car.id}`} className="flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold text-content-secondary hover:bg-app-muted">Xem chi tiết và quy định</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searched && vehicles.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {vehicles.map((car) => (
                  <div key={car.id} className={`${panelClassName} group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/45 hover:shadow-md motion-reduce:transform-none`}>
                    <div className="relative h-[180px]">
                      {car.images[0] ? <Image src={car.images[0]} alt={car.model} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /> : <div className="flex h-full items-center justify-center bg-app-muted"><Car className="h-12 w-12 text-content-secondary" /></div>}
                      <span className="absolute bottom-3 left-3 bg-night-surface/80 text-night-content text-xs font-semibold px-2 py-1 rounded-md border border-app-border/50">
                        Biển số: {car.plateNumber}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-grow gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-content-secondary block uppercase font-medium">{car.brand}</span>
                          <h3 className="mt-0.5 text-lg font-bold text-content">{car.model}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-content-secondary block">Giá chuẩn</span>
                          <span className="text-base font-bold text-rental-price">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-lg border-y border-app-border/35 bg-app-muted py-2 text-center text-xs text-content-secondary">
                        <div>
                          <span className="block text-content-secondary">Ghế</span>
                          <strong>{car.seats} Chỗ</strong>
                        </div>
                        <div>
                          <span className="block text-content-secondary">Số</span>
                          <strong>{vehicleTransmissionLabel(car.transmission)}</strong>
                        </div>
                        <div>
                          <span className="block text-content-secondary">Vận hành</span>
                          <strong>{vehicleFuelLabel(car.fuel)}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedVehicle(car)}
                        className="gradient-btn mt-auto min-h-11 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
                      >
                        Chọn & Điền hồ sơ
                      </button>
                      <Link href={`/vehicles/${car.id}`} className="flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold text-content-secondary hover:bg-app-muted">Xem chi tiết và quy định</Link>
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
              <h2 className="border-b border-app-border/35 pb-3 text-lg font-bold text-content">Tóm tắt chuyến đi</h2>
              <div className="flex gap-4 items-center">
                {selectedVehicle.images[0] ? <Image
                  src={selectedVehicle.images[0]}
                  alt={selectedVehicle.model}
                  width={80}
                  height={64}
                  className="h-16 w-20 rounded-lg border border-app-border/35 object-cover"
                /> : <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-app-muted"><Car className="h-8 w-8 text-content-secondary" /></div>}
                <div>
                  <h3 className="font-bold text-content">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                  <p className="text-xs text-content-secondary">Biển số: {selectedVehicle.plateNumber}</p>
                </div>
              </div>
              <hr className="border-app-border/35" />
              <div className="rounded-xl border border-brand/25 bg-utility p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-bold text-utility-foreground">
                      Điều chỉnh lịch thuê
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-utility-foreground">
                      Giá được backend tính lại ngay sau khi bạn đổi ngày hoặc giờ.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvailabilityOpen(true)}
                    className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-brand bg-app-surface px-3 text-xs font-bold text-brand transition hover:bg-app-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <CalendarRange className="h-4 w-4" />
                    Xem lịch trống
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-content-secondary">
                    Ngày nhận
                    <input
                      type="date"
                      min={todayDate}
                      value={startDate}
                      onChange={(event) => {
                        const value = event.target.value;
                        setStartDate(value);
                        if (endDate && endDate < value) setEndDate('');
                      }}
                      className={fieldClassName}
                    />
                  </label>
                  <label className="text-xs font-bold text-content-secondary">
                    Giờ nhận
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className={fieldClassName}
                    />
                  </label>
                  <label className="text-xs font-bold text-content-secondary">
                    Ngày trả
                    <input
                      type="date"
                      min={startDate || todayDate}
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className={fieldClassName}
                    />
                  </label>
                  <label className="text-xs font-bold text-content-secondary">
                    Giờ trả
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className={fieldClassName}
                    />
                  </label>
                </div>
                {activeQuoteError && (
                  <p
                    role="alert"
                    className="mt-3 rounded-lg bg-danger-muted p-3 text-xs font-semibold text-danger"
                  >
                    {activeQuoteError}
                  </p>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 text-content-secondary">
                  <span>Điểm giao nhận:</span>
                  <span className="max-w-[220px] text-right font-medium text-content">{storeInfo.address}</span>
                </div>
              </div>
              <hr className="border-app-border/35" />
              <div className="text-sm space-y-2">
                <div className="flex justify-between text-content-secondary">
                  <span>Tổng ngày thuê:</span>
                  <span className="font-bold text-content">{activeQuote ? `${activeQuote.totalDays} ngày` : '—'}</span>
                </div>
                <div className="flex justify-between text-content-secondary">
                  <span>Giá thuê:</span>
                  <span className="text-content">{activeQuote ? `${activeQuote.basePrice.toLocaleString('vi-VN')}đ` : '—'}</span>
                </div>
                <div className="flex justify-between text-content-secondary">
                  <span>Phí bảo hiểm:</span>
                  <span className="text-content">{activeQuote ? `${activeQuote.insuranceFee.toLocaleString('vi-VN')}đ` : '—'}</span>
                </div>
                {activeQuote && activeQuote.discountAmount > 0 && <div className="flex justify-between text-brand"><span>Giảm giá:</span><span>-{activeQuote.discountAmount.toLocaleString()}đ</span></div>}
                <div className="flex justify-between border-t border-app-border/35 pt-2 font-bold text-content-secondary">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-rental-price">{activeQuoteLoading ? 'Đang tính…' : activeQuote ? `${activeQuote.totalPrice.toLocaleString()}đ` : 'Chưa có báo giá'}</span>
                </div>
                <div className="flex justify-between text-base font-black text-rental-price">
                  <span>Tiền đặt cọc ({depositPercent}%):</span>
                  <span>{activeQuote ? `${activeQuote.depositAmount.toLocaleString()}đ` : '—'}</span>
                </div>
                {activeQuote?.couponMessage && <p className="text-xs text-warning">{activeQuote.couponMessage}</p>}
              </div>

              {currentUser && selectedVehicle.ownerId && (
                <button
                  onClick={() => setShowChatModal(true)}
                  className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-utility px-4 py-2.5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat trực tiếp với chủ xe</span>
                </button>
              )}
            </div>

            {/* 2. Bản đồ tọa độ (Map widget) */}
            <div className={`${panelClassName} flex flex-col gap-4 p-6`}>
              <h3 className="flex items-center gap-2 border-b border-app-border/35 pb-2 font-bold text-content">
                <Map className="h-4.5 w-4.5 text-brand" />
                <span>Vị Trí Nhận Xe</span>
              </h3>
              <p className="text-sm leading-6 text-content-secondary">{storeInfo.address} · {storeInfo.hours}</p>

              <div className="relative flex h-40 flex-col items-center justify-center overflow-hidden rounded-lg border border-app-border/35 bg-app-muted">
                <iframe
                  src={`https://maps.google.com/maps?q=${storeInfo.latitude},${storeInfo.longitude}&z=16&output=embed`}
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
              <h3 className="flex items-center gap-2 border-b border-app-border/35 pb-2 font-bold text-content">
                <Star className="h-4.5 w-4.5 text-warning fill-current" />
                <span>Nhận xét khách hàng ({reviewsList.length})</span>
              </h3>
              {reviewsList.length === 0 ? (
                <p className="py-4 text-center text-xs text-content-secondary">Chưa có đánh giá nào cho xe này.</p>
              ) : (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="flex flex-col gap-1 rounded-lg border border-app-border/35 bg-app-muted p-3 text-xs">
                      <div className="flex justify-between text-content-secondary">
                        <span className="font-bold text-content">{rev.customer?.fullName || 'Khách ẩn danh'}</span>
                        <div className="flex gap-0.5 text-warning">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="leading-relaxed text-content-secondary">{rev.comment}</p>
                      <span className="mt-1 block text-right text-[10px] text-content-secondary">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Cột Phải: Form thông tin, Upload tài liệu, Insurance & Deposit */}
          <div className={`lg:col-span-2 ${panelClassName} flex flex-col gap-6 p-6`}>
            <h2 className="border-b border-app-border/35 pb-3 text-lg font-bold text-content">Thông Tin Đăng Ký Thuê Xe</h2>

            <form onSubmit={handleBook} className="flex flex-col gap-6">

              {/* Form cá nhân */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClassName}>Họ và tên (CCCD)</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-content-secondary" />
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
                    <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-content-secondary" />
                    <input
                      type="tel"
                      required
                      readOnly={Boolean(currentUser)}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0987654321"
                      className={`${fieldClassName} pl-10 read-only:bg-app-muted`}
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
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-content">
                  <Shield className="h-4.5 w-4.5 text-brand" />
                  <span>Bảo Hiểm Thân Vỏ Tự Nguyện</span>
                </h3>
                <div className="grid md:grid-cols-3 gap-3">

                  {/* None */}
                  <label className={`${optionClassName} flex cursor-pointer flex-col gap-1 ${insuranceType === 'NONE' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-content">Gói Tiêu chuẩn</span>
                      <input
                        type="radio"
                        name="insurance"
                        checked={insuranceType === 'NONE'}
                        onChange={() => setInsuranceType('NONE')}
                        className="accent-brand"
                      />
                    </div>
                    <span className="text-xs text-content-secondary">Khách tự chịu trách nhiệm va chạm</span>
                    <strong className="mt-2 text-xs text-brand">0đ / ngày</strong>
                  </label>

                  {/* Basic */}
                  <label className={`${optionClassName} flex cursor-pointer flex-col gap-1 ${insuranceType === 'BASIC' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-content">Gói Cơ Bản</span>
                      <input
                        type="radio"
                        name="insurance"
                        checked={insuranceType === 'BASIC'}
                        onChange={() => setInsuranceType('BASIC')}
                        className="accent-brand"
                      />
                    </div>
                    <span className="text-xs text-content-secondary">Bồi thường va chạm đến 80%</span>
                    <strong className="mt-2 text-xs text-brand">100,000đ / ngày</strong>
                  </label>

                  {/* Premium */}
                  <label className={`${optionClassName} flex cursor-pointer flex-col gap-1 ${insuranceType === 'PREMIUM' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-semibold text-content">Gói VIP Cao Cấp</span>
                      <input
                        type="radio"
                        name="insurance"
                        checked={insuranceType === 'PREMIUM'}
                        onChange={() => setInsuranceType('PREMIUM')}
                        className="accent-brand"
                      />
                    </div>
                    <span className="text-xs text-content-secondary">Bảo hiểm 100% không khấu hao</span>
                    <strong className="mt-2 text-xs text-brand">250,000đ / ngày</strong>
                  </label>
                </div>
              </div>

              {/* 2. Chọn Tỷ Lệ Cọc */}
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-content">
                  <CreditCard className="h-4.5 w-4.5 text-brand" />
                  <span>Chọn Tỷ Lệ Đặt Cọc</span>
                </h3>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setDepositPercent(30)}
                    className={`min-h-11 flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer ${
                      depositPercent === 30 ? 'border-brand bg-utility text-brand ring-1 ring-brand/15' : 'border-app-border bg-app-surface text-content-secondary hover:border-app-border hover:bg-app-muted'
                    }`}
                  >
                    Cọc trước 30%
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositPercent(50)}
                    className={`min-h-11 flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer ${
                      depositPercent === 50 ? 'border-brand bg-utility text-brand ring-1 ring-brand/15' : 'border-app-border bg-app-surface text-content-secondary hover:border-app-border hover:bg-app-muted'
                    }`}
                  >
                    Cọc trước 50%
                  </button>
                </div>
              </div>

              {/* Upload hồ sơ */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-content">Tài Liệu Hồ Sơ Xác Thực (Bắt buộc)</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-app-border bg-app-muted p-4 text-center transition hover:border-brand hover:bg-utility/40">
                    {idCardFront ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={idCardFront} alt="CCCD mặt trước" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-brand text-on-brand text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : storedDocuments.idCardFront ? (
                      <>
                        <CheckCircle2 className="h-7 w-7 text-brand" />
                        <span className="text-xs font-bold text-brand">Đã lưu CCCD mặt trước</span>
                        <span className="text-[11px] text-content-secondary">Chọn tệp để thay thế</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-content-secondary" />
                        <span className="text-xs font-medium text-content-secondary">CCCD Mặt trước</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileUpload('front', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-app-border bg-app-muted p-4 text-center transition hover:border-brand hover:bg-utility/40">
                    {idCardBack ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={idCardBack} alt="CCCD mặt sau" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-brand text-on-brand text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : storedDocuments.idCardBack ? (
                      <>
                        <CheckCircle2 className="h-7 w-7 text-brand" />
                        <span className="text-xs font-bold text-brand">Đã lưu CCCD mặt sau</span>
                        <span className="text-[11px] text-content-secondary">Chọn tệp để thay thế</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-content-secondary" />
                        <span className="text-xs font-medium text-content-secondary">CCCD Mặt sau</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileUpload('back', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-app-border bg-app-muted p-4 text-center transition hover:border-brand hover:bg-utility/40">
                    {driverLicense ? (
                      <div className="w-full h-24 relative rounded overflow-hidden">
                        <Image unoptimized fill sizes="200px" src={driverLicense} alt="Giấy phép lái xe" className="object-cover" />
                        <span className="absolute bottom-1 right-1 bg-brand text-on-brand text-[10px] px-1 rounded flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      </div>
                    ) : storedDocuments.driverLicense ? (
                      <>
                        <CheckCircle2 className="h-7 w-7 text-brand" />
                        <span className="text-xs font-bold text-brand">Đã lưu giấy phép lái xe</span>
                        <span className="text-[11px] text-content-secondary">Chọn tệp để thay thế</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-content-secondary" />
                        <span className="text-xs font-medium text-content-secondary">Giấy phép lái xe (GPLX)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileUpload('license', e)}
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
                    <Tag className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-content-secondary" />
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
                    <Sparkles className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-content-secondary" />
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
                <h3 className="mb-3 text-sm font-bold text-content">Hình Thức Đặt Cọc</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <label className={`${optionClassName} flex min-h-20 cursor-pointer items-center justify-between gap-3 ${paymentMethod === 'BANK_TRANSFER' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 shrink-0 text-brand" />
                      <span className="text-sm font-semibold text-content">VietQR / Ngân Hàng</span>
                    </div>
                    <input
                      type="radio"
                      name="payMethod"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={() => setPaymentMethod('BANK_TRANSFER')}
                      className="accent-brand"
                    />
                  </label>

                  <label className={`${optionClassName} flex min-h-20 cursor-pointer items-center justify-between gap-3 ${paymentMethod === 'MOMO' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded bg-payment-momo text-night-content font-bold text-[10px] flex items-center justify-center">M</div>
                      <span className="text-sm font-semibold text-content">Ví MoMo</span>
                    </div>
                    <input
                      type="radio"
                      name="payMethod"
                      value="MOMO"
                      checked={paymentMethod === 'MOMO'}
                      onChange={() => setPaymentMethod('MOMO')}
                      className="accent-brand"
                    />
                  </label>

                  <label className={`${optionClassName} flex min-h-20 cursor-pointer items-center justify-between gap-3 ${paymentMethod === 'CASH' ? selectedOptionClassName : idleOptionClassName}`}>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 shrink-0 text-brand" />
                      <span className="text-sm font-semibold text-content">Tiền mặt tại showroom</span>
                    </div>
                    <input
                      type="radio"
                      name="payMethod"
                      value="CASH"
                      checked={paymentMethod === 'CASH'}
                      onChange={() => setPaymentMethod('CASH')}
                      className="accent-brand"
                    />
                  </label>
                </div>
              </div>

              <section className="rounded-2xl border border-app-border/35 bg-app-muted p-5">
                <h3 className="font-bold text-content">Cửa hàng và quy định đặt xe</h3>
                <div className="mt-3 grid gap-2 text-sm text-content-secondary sm:grid-cols-2">
                  <p><strong>Địa chỉ:</strong> {storeInfo.address}</p>
                  <p><strong>Giờ hỗ trợ:</strong> {storeInfo.hours}</p>
                  <p><strong>Hotline:</strong> {storeInfo.phone}</p>
                  <p><strong>Email:</strong> {storeInfo.supportEmail}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {rentalPolicies.map((policy) => (
                    <div key={policy.title} className="rounded-xl bg-app-surface p-3">
                      <p className="text-sm font-bold text-content">{policy.title}</p>
                      <p className="mt-1 text-xs leading-5 text-content-secondary">{policy.description}</p>
                    </div>
                  ))}
                </div>
                {selectedVehicle.terms && <p className="mt-4 whitespace-pre-line rounded-xl border border-warning/30 bg-warning-muted p-3 text-sm text-warning"><strong>Quy định riêng của xe:</strong><br />{selectedVehicle.terms}</p>}
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-brand/30 bg-utility p-4">
                  <input type="checkbox" checked={acceptedPolicies} onChange={(event) => setAcceptedPolicies(event.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
                  <span className="text-sm font-medium leading-6 text-brand">Tôi đã kiểm tra lịch, báo giá và đồng ý với quy định thuê xe nêu trên.</span>
                </label>
              </section>

              <button
                type="submit"
                disabled={bookingLoading || activeQuoteLoading || !activeQuote || !acceptedPolicies}
                className="gradient-btn mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-lg font-semibold text-on-brand shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-surface/70 backdrop-blur-sm p-4">
          <div className="flex h-[min(500px,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-app-border/35 bg-app-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-app-border/35 bg-app-muted p-4 font-bold text-content">
              <span>Chat với Chủ xe</span>
              <button
                onClick={() => setShowChatModal(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-content-secondary transition hover:bg-app-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
                aria-label="Đóng cửa sổ chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <div className="my-auto text-center text-xs text-content-secondary">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.</div>
              ) : (
                chatMessages.map((chat, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[75%] p-3 rounded-xl text-sm ${
                      chat.senderId === currentUser?.id
                        ? 'bg-brand text-on-brand self-end rounded-br-none'
                        : 'self-start rounded-bl-none border border-app-border/35 bg-app-muted text-content'
                    }`}
                  >
                    <p>{chat.message}</p>
                    <span className={`mt-1 block text-right text-[10px] ${chat.senderId === currentUser?.id ? 'text-on-brand' : 'text-content-secondary'}`}>
                      {new Date(chat.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-app-border/35 bg-app-muted p-4">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className={`${fieldClassName} flex-grow`}
              />
              <button
                type="submit"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-brand p-2 text-on-brand transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
                aria-label="Gửi tin nhắn"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {availabilityOpen && selectedVehicle && (
        <VehicleAvailabilityDialog
          vehicle={selectedVehicle}
          initialStartDate={startDate}
          initialEndDate={endDate}
          onApply={(nextStartDate, nextEndDate) => {
            setStartDate(nextStartDate);
            setEndDate(nextEndDate);
          }}
          onClose={() => setAvailabilityOpen(false)}
        />
      )}

      </div>
    </main>
  );
}
