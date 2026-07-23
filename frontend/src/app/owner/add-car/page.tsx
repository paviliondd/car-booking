'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, type VehicleInput } from '@/lib/api';
import { Car, ChevronLeft, Upload, Loader2, DollarSign, MapPin, Sliders, X } from 'lucide-react';
import { storeInfo } from '@/lib/store';

export default function AddCarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const adminMode = pathname.startsWith('/dashboard');
  const returnPath = adminMode ? '/dashboard/vehicles' : '/owner';
  const editingId = pathname.match(/\/vehicles\/([^/]+)\/edit$/)?.[1] || null;
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [year, setYear] = useState(2024);
  const [seats, setSeats] = useState(5);
  const [transmission, setTransmission] = useState('AUTO');
  const [fuel, setFuel] = useState('GASOLINE');
  const [color, setColor] = useState('Đen');
  const [dailyPrice, setDailyPrice] = useState(800000);
  const [weekendPrice, setWeekendPrice] = useState(1000000);
  const [holidayPrice, setHolidayPrice] = useState(1200000);
  const [penaltyRate, setPenaltyRate] = useState(100000);
  
  // Advanced features fields
  const [limitKmPerDay, setLimitKmPerDay] = useState(300);
  const [overLimitFee, setOverLimitFee] = useState(3000);
  const [terms, setTerms] = useState('Không hút thuốc lá trên xe. Không chở động vật/hàng cấm.');
  
  // Images (multi image inputs)
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const verifyOwner = async () => {
      try {
        const me = await api.auth.me();
        const ownerAllowed = me.role === 'OWNER' && me.isVerifiedOwner;
        const adminAllowed = adminMode && (me.role === 'ADMIN' || me.role === 'STAFF');
        if (!ownerAllowed && !adminAllowed) {
          router.replace(me.role === 'OWNER' ? '/owner' : '/dashboard');
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace('/auth');
      }
    };
    void verifyOwner();
  }, [adminMode, router]);

  useEffect(() => {
    if (!authorized || !editingId) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      api.vehicles.findOne(editingId).then((vehicle) => {
      setBrand(vehicle.brand);
      setModel(vehicle.model);
      setPlateNumber(vehicle.plateNumber);
      setYear(vehicle.year);
      setSeats(vehicle.seats);
      setTransmission(vehicle.transmission);
      setFuel(vehicle.fuel);
      setColor(vehicle.color || '');
      setDailyPrice(vehicle.dailyPrice);
      setWeekendPrice(vehicle.weekendPrice);
      setHolidayPrice(vehicle.holidayPrice);
      setPenaltyRate(vehicle.penaltyRate);
      setLimitKmPerDay(vehicle.limitKmPerDay || 0);
      setOverLimitFee(vehicle.overLimitFee || 0);
      setTerms(vehicle.terms || '');
      setImages(vehicle.images);
      }).catch((err: unknown) => setErrorMsg(err instanceof Error ? err.message : 'Không thể tải thông tin xe.'))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authorized, editingId]);

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setErrorMsg('');
    try {
      const uploaded = await api.storage.uploadVehicleImage(file);
      setImages((current) => [...current, uploaded.url]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tải ảnh xe lên VPS.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (images.length === 0) {
        setErrorMsg('Vui lòng tải ít nhất một ảnh xe trước khi đăng.');
        return;
      }
      const payload: VehicleInput = {
        brand,
        model,
        plateNumber,
        year: Number(year),
        seats: Number(seats),
        transmission,
        fuel,
        color,
        dailyPrice: Number(dailyPrice),
        weekendPrice: Number(weekendPrice),
        holidayPrice: Number(holidayPrice),
        penaltyRate: Number(penaltyRate),
        limitKmPerDay: Number(limitKmPerDay),
        overLimitFee: Number(overLimitFee),
        terms,
        images,
      };

      if (editingId) await api.vehicles.update(editingId, payload);
      else await api.vehicles.create(payload);
      router.push(returnPath);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể lưu xe. Hãy kiểm tra lại biển số hoặc dữ liệu nhập.');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <main className="dark flex min-h-dvh items-center justify-center bg-app-surface">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Đang xác thực quyền chủ xe" />
      </main>
    );
  }

  return (
    <div className="dark min-h-screen bg-app-surface py-12 px-6 md:px-12 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header Back */}
      <div className="flex justify-between items-center border-b border-app-border/30 pb-6">
        <button 
          onClick={() => router.push(returnPath)}
          className="flex items-center gap-2 text-sm text-content-secondary hover:text-content transition bg-app-muted/70 px-4 py-2 rounded-lg border border-app-border/30 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{adminMode ? 'Về danh sách xe' : 'Về Dashboard'}</span>
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-content flex items-center gap-2">
          <Car className="h-6 w-6 text-brand" />
          <span>{editingId ? 'Chỉnh Sửa Thông Tin Xe' : 'Đăng Ký Xe Cho Thuê'}</span>
        </h1>
      </div>

      {errorMsg && (
        <div className="bg-danger-muted border border-danger/35 text-danger p-4 rounded-xl text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="glass-panel p-6 rounded-xl border border-app-border/30 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-content flex items-center gap-2 border-b border-app-border/30 pb-3">
            <Car className="h-5 w-5 text-brand" />
            <span>Thông Tin Cơ Bản Xe</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Hãng xe</label>
              <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="VinFast" className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Dòng xe (Model)</label>
              <input type="text" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="VF8" className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Biển kiểm soát (BKS)</label>
              <input type="text" required value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="30K-123.45" className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Năm sản xuất</label>
              <input type="number" required value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Số chỗ ngồi</label>
              <input type="number" required value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Hộp số</label>
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content">
                <option value="AUTO">Số tự động (AUTO)</option>
                <option value="MANUAL">Số sàn (MANUAL)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Loại nhiên liệu</label>
              <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content">
                <option value="GASOLINE">Xăng</option>
                <option value="DIESEL">Dầu</option>
                <option value="ELECTRIC">Xe điện</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Màu sắc</label>
              <input type="text" required value={color} onChange={(e) => setColor(e.target.value)} placeholder="Trắng" className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
          </div>
        </div>

        {/* SECTION 2: GIÁ & CẤU HÌNH PHẠT */}
        <div className="glass-panel p-6 rounded-xl border border-app-border/30 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-content flex items-center gap-2 border-b border-app-border/30 pb-3">
            <DollarSign className="h-5 w-5 text-brand" />
            <span>Biểu Phí Cho Thuê & Phạt Trễ</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Giá ngày thường / ngày</label>
              <input type="number" required value={dailyPrice} onChange={(e) => setDailyPrice(Number(e.target.value))} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Giá cuối tuần / ngày</label>
              <input type="number" required value={weekendPrice} onChange={(e) => setWeekendPrice(Number(e.target.value))} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Giá ngày lễ / ngày</label>
              <input type="number" required value={holidayPrice} onChange={(e) => setHolidayPrice(Number(e.target.value))} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Phí phạt trễ / giờ (VND)</label>
              <input type="number" required value={penaltyRate} onChange={(e) => setPenaltyRate(Number(e.target.value))} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
          </div>
        </div>

        {/* SECTION 3: NÂNG CAO - GIỚI HẠN KM & ĐỊA ĐIỂM */}
        <div className="glass-panel p-6 rounded-xl border border-app-border/30 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-content flex items-center gap-2 border-b border-app-border/30 pb-3">
            <Sliders className="h-5 w-5 text-brand" />
            <span>Giới Hạn Di Chuyển & Điểm Nhận Xe</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Giới hạn di chuyển tối đa / ngày (km)</label>
              <input type="number" required value={limitKmPerDay} onChange={(e) => setLimitKmPerDay(Number(e.target.value))} placeholder="300" className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
            <div>
              <label className="text-xs text-content-secondary block mb-1.5 font-medium">Phí phạt phụ trội km (VND/km)</label>
              <input type="number" required value={overLimitFee} onChange={(e) => setOverLimitFee(Number(e.target.value))} placeholder="3000" className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-brand/35 bg-utility p-4 text-sm text-content">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div><p className="font-bold">{storeInfo.serviceArea}</p><p className="mt-1 text-content-secondary">{storeInfo.address} · {storeInfo.hours}. Địa điểm do hệ thống quản lý và áp dụng cho mọi xe.</p></div>
          </div>

          <div>
            <label className="text-xs text-content-secondary block mb-1.5 font-medium">Quy định thuê xe của chủ sở hữu (Terms & Rules)</label>
            <textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content" />
          </div>
        </div>

        {/* SECTION 4: HÌNH ẢNH XE */}
        <div className="glass-panel p-6 rounded-xl border border-app-border/30 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-content flex items-center gap-2 border-b border-app-border/30 pb-3">
            <Upload className="h-5 w-5 text-brand" />
            <span>Hình Ảnh Phương Tiện ({images.length})</span>
          </h2>

          <div className="flex flex-col gap-2">
            <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-hover focus-within:ring-2 focus-within:ring-brand/40">
              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{uploadingImage ? 'Đang tải ảnh...' : 'Tải ảnh từ thiết bị'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingImage}
                onChange={(event) => void handleAddImage(event)}
                className="sr-only"
              />
            </label>
            <p className="text-xs text-content-secondary">JPG, PNG hoặc WebP; tối đa 8 MB mỗi ảnh. Tệp được lưu trên VPS.</p>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-2">
            {images.map((img, i) => (
              <div key={i} className="relative h-20 border border-app-border/50 rounded-lg overflow-hidden group">
                <Image unoptimized fill sizes="180px" src={img} alt={`Ảnh xe ${i + 1}`} className="object-cover" />
                <button 
                  type="button" 
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-1 right-1 bg-danger-muted hover:bg-danger-muted text-danger rounded-full p-1 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full gradient-btn text-on-brand font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-lg disabled:opacity-50"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          <span>{loading ? 'Đang lưu hồ sơ xe...' : editingId ? 'Lưu Thay Đổi' : 'Xác Nhận Đăng Xe'}</span>
        </button>
      </form>
    </div>
  );
}
