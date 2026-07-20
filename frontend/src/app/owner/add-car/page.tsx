'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Car, ChevronLeft, Upload, Loader2, DollarSign, MapPin, Sliders, X } from 'lucide-react';

export default function AddCarPage() {
  const router = useRouter();
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
  const [pickupLocation, setPickupLocation] = useState('Số 12 Khuất Duy Tiến, Thanh Xuân, Hà Nội');
  const [latitude, setLatitude] = useState(20.9996);
  const [longitude, setLongitude] = useState(105.7981);
  const [terms, setTerms] = useState('Không hút thuốc lá trên xe. Không chở động vật/hàng cấm.');
  
  // Images (multi image inputs)
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    const verifyOwner = async () => {
      try {
        const me = await api.auth.me();
        if (me.role !== 'OWNER' || !me.isVerifiedOwner) {
          router.replace('/owner');
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace('/auth');
      }
    };
    void verifyOwner();
  }, [router]);

  const handleAddImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
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
      const payload = {
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
        pickupLocation,
        latitude: Number(latitude),
        longitude: Number(longitude),
        terms,
        images,
      };

      await api.vehicles.create(payload);
      router.push('/owner');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi thêm xe mới. Hãy kiểm tra lại biển số hoặc dữ liệu nhập.');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" aria-label="Đang xác thực quyền chủ xe" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] py-12 px-6 md:px-12 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header Back */}
      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <button 
          onClick={() => router.push('/owner')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition bg-gray-900/50 px-4 py-2 rounded-lg border border-white/5 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Về Dashboard</span>
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Car className="h-6 w-6 text-green-500" />
          <span>Đăng Ký Xe Cho Thuê</span>
        </h1>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Car className="h-5 w-5 text-green-400" />
            <span>Thông Tin Cơ Bản Xe</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Hãng xe</label>
              <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="VinFast" className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Dòng xe (Model)</label>
              <input type="text" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="VF8" className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Biển kiểm soát (BKS)</label>
              <input type="text" required value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="30K-123.45" className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Năm sản xuất</label>
              <input type="number" required value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Số chỗ ngồi</label>
              <input type="number" required value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Hộp số</label>
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white">
                <option value="AUTO">Số tự động (AUTO)</option>
                <option value="MANUAL">Số sàn (MANUAL)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Loại nhiên liệu</label>
              <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white">
                <option value="GASOLINE">Xăng (GASOLINE)</option>
                <option value="DIESEL">Dầu (DIESEL)</option>
                <option value="ELECTRIC">Điện (ELECTRIC)</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Màu sắc</label>
              <input type="text" required value={color} onChange={(e) => setColor(e.target.value)} placeholder="Trắng" className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
          </div>
        </div>

        {/* SECTION 2: GIÁ & CẤU HÌNH PHẠT */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span>Biểu Phí Cho Thuê & Phạt Trễ</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Giá ngày thường / ngày</label>
              <input type="number" required value={dailyPrice} onChange={(e) => setDailyPrice(Number(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Giá cuối tuần / ngày</label>
              <input type="number" required value={weekendPrice} onChange={(e) => setWeekendPrice(Number(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Giá ngày lễ / ngày</label>
              <input type="number" required value={holidayPrice} onChange={(e) => setHolidayPrice(Number(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Phí phạt trễ / giờ (VND)</label>
              <input type="number" required value={penaltyRate} onChange={(e) => setPenaltyRate(Number(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
          </div>
        </div>

        {/* SECTION 3: NÂNG CAO - GIỚI HẠN KM & ĐỊA ĐIỂM */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Sliders className="h-5 w-5 text-green-400" />
            <span>Giới Hạn Di Chuyển & Tọa Độ Bản Đồ</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Giới hạn di chuyển tối đa / ngày (km)</label>
              <input type="number" required value={limitKmPerDay} onChange={(e) => setLimitKmPerDay(Number(e.target.value))} placeholder="300" className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Phí phạt phụ trội km (VND/km)</label>
              <input type="number" required value={overLimitFee} onChange={(e) => setOverLimitFee(Number(e.target.value))} placeholder="3000" className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Địa điểm bàn giao/nhận xe</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input type="text" required value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-green-500 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Vĩ độ (Lat)</label>
                <input type="number" step="any" required value={latitude} onChange={(e) => setLatitude(Number(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Kinh độ (Lng)</label>
                <input type="number" step="any" required value={longitude} onChange={(e) => setLongitude(Number(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-medium">Quy định thuê xe của chủ sở hữu (Terms & Rules)</label>
            <textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" />
          </div>
        </div>

        {/* SECTION 4: HÌNH ẢNH XE */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Upload className="h-5 w-5 text-green-400" />
            <span>Hình Ảnh Phương Tiện ({images.length})</span>
          </h2>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={newImageUrl} 
              onChange={(e) => setNewImageUrl(e.target.value)} 
              placeholder="Nhập đường dẫn URL ảnh xe trực tuyến..." 
              className="flex-grow bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" 
            />
            <button 
              onClick={handleAddImage}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
            >
              Thêm URL
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-2">
            {images.map((img, i) => (
              <div key={i} className="relative h-20 border border-white/10 rounded-lg overflow-hidden group">
                <Image unoptimized fill sizes="180px" src={img} alt={`Ảnh xe ${i + 1}`} className="object-cover" />
                <button 
                  type="button" 
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition cursor-pointer"
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
          className="w-full gradient-btn text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-lg disabled:opacity-50"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          <span>{loading ? 'Đang tạo hồ sơ xe...' : 'Xác Nhận Đăng Xe'}</span>
        </button>
      </form>
    </div>
  );
}
