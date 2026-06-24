'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Car, User, Phone, MapPin, DollarSign, Calendar, MessageSquare, 
  ChevronRight, ArrowUpRight, Check, X, ShieldAlert, Award, FileText, 
  Activity, Loader2, Plus, LogOut, Send, AlertCircle
} from 'lucide-react';

export default function OwnerDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Upgrade form states
  const [upgradePhone, setUpgradePhone] = useState('');
  const [upgradeIdCard, setUpgradeIdCard] = useState('');
  const [upgradeAddress, setUpgradeAddress] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'requests' | 'chat'>('overview');

  // Owner Data States
  const [myCars, setMyCars] = useState<any[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [completedTrips, setCompletedTrips] = useState(0);

  // Chat States
  const [chatPartners, setChatPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        fetchMe();
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchMe = async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      if (me.role === 'OWNER' && me.isVerifiedOwner) {
        await loadOwnerData();
      }
    } catch (err) {
      console.error(err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/auth');
  };

  const loadOwnerData = async () => {
    try {
      const cars = await api.vehicles.getMyCars();
      setMyCars(cars);

      const requests = await api.bookings.getOwnerRequests();
      setBookingRequests(requests);

      // Tính toán doanh thu & số chuyến đi đã hoàn thành
      let totalEarnings = 0;
      let tripsCount = 0;
      requests.forEach((req: any) => {
        if (req.status === 'COMPLETED') {
          totalEarnings += req.totalPrice;
          tripsCount++;
        }
      });
      setEarnings(totalEarnings);
      setCompletedTrips(tripsCount);

      // Load chat partners
      const partners = await api.chat.getPartners();
      setChatPartners(partners);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu chủ xe', err);
    }
  };

  // Nâng cấp lên chủ xe
  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeLoading(true);
    setUpgradeError('');
    try {
      await api.auth.upgradeOwner({
        phone: upgradePhone,
        idCardNo: upgradeIdCard,
        address: upgradeAddress
      });
      setUpgradeSuccess(true);
      setTimeout(() => {
        fetchMe();
      }, 3000);
    } catch (err: any) {
      setUpgradeError(err.message || 'Lỗi nâng cấp tài khoản.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Duyệt/Từ chối đơn đặt xe
  const handleRequestStatus = async (bookingId: string, status: string) => {
    try {
      await api.bookings.updateStatus(bookingId, status);
      await loadOwnerData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái đơn đặt.');
    }
  };

  // Đổi trạng thái xe
  const handleToggleCarStatus = async (carId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
      await api.vehicles.updateStatus(carId, newStatus);
      await loadOwnerData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái xe.');
    }
  };

  // Chat Real-time (Sử dụng WebSockets Gateway backend)
  useEffect(() => {
    if (selectedPartner) {
      // Load lịch sử chat
      api.chat.getHistory(selectedPartner.id).then((history) => {
        setChatHistory(history);
      });

      // Kết nối WebSocket trực tiếp tới backend Gateway
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (
          (data.senderId === user.id && data.receiverId === selectedPartner.id) ||
          (data.senderId === selectedPartner.id && data.receiverId === user.id)
        ) {
          setChatHistory((prev) => [...prev, data]);
        }
      };

      setWs(socket);

      return () => {
        socket.close();
      };
    }
  }, [selectedPartner]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner || !user) return;

    const payload = {
      senderId: user.id,
      receiverId: selectedPartner.id,
      message: newMessage,
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: 'sendMessage', data: payload }));
    } else {
      // Dự phòng bằng REST API hoặc tự đẩy vào state để giả lập phản hồi nhanh
      // (Nhưng backend Gateway đã có WS socket.io)
      try {
        const saved = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        }).then(r => r.json());
        setChatHistory((prev) => [...prev, saved]);
      } catch (err) {
        console.error(err);
      }
    }
    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!token) {
    router.push('/auth');
    return null;
  }

  // TRƯỜNG HỢP: LÀ CUSTOMER VÀ CHƯA ĐƯỢC PHÊ DUYỆT CHỦ XE
  if (user?.role === 'CUSTOMER' || !user?.isVerifiedOwner) {
    return (
      <div className="min-h-screen bg-[#080b11] py-12 px-6 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[150px]"></div>
        <div className="max-w-xl w-full glass-panel border border-white/5 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <Car className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Đăng ký trở thành Chủ xe</h1>
            <p className="text-xs text-gray-400 mt-2">Nâng cấp tài khoản để bắt đầu chia sẻ xe và kiếm thu nhập thụ động cùng datxe</p>
          </div>

          {upgradeSuccess ? (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-6 rounded-xl flex flex-col gap-3 items-center text-center">
              <Check className="h-12 w-12 text-green-400 bg-green-500/10 p-2 rounded-full" />
              <h3 className="font-bold text-lg">Gửi yêu cầu thành công!</h3>
              <p className="text-sm">Hồ sơ của bạn đang được Ban Quản Trị hệ thống thẩm định và phê duyệt (CCCD, SĐT). Tiến trình nâng cấp sẽ tự động hoàn tất trong vòng vài giờ.</p>
            </div>
          ) : (
            <form onSubmit={handleUpgrade} className="flex flex-col gap-4">
              {upgradeError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
                  ⚠️ {upgradeError}
                </div>
              )}

              {user?.ownerRequestAt && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>Bạn đã gửi yêu cầu nâng cấp vào lúc {new Date(user.ownerRequestAt).toLocaleString()}. Vui lòng chờ Admin duyệt!</span>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Số điện thoại liên hệ</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input 
                    type="tel" 
                    required 
                    value={upgradePhone}
                    onChange={(e) => setUpgradePhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-green-500 text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Số Căn cước công dân (CCCD)</label>
                <input 
                  type="text" 
                  required 
                  value={upgradeIdCard}
                  onChange={(e) => setUpgradeIdCard(e.target.value)}
                  placeholder="037200123456"
                  className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-green-500 text-white" 
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Địa chỉ cư trú</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input 
                    type="text" 
                    required 
                    value={upgradeAddress}
                    onChange={(e) => setUpgradeAddress(e.target.value)}
                    placeholder="Số 10, Đường ABC, Quận XYZ, Hà Nội"
                    className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-green-500 text-white" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={upgradeLoading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 transition"
              >
                {upgradeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Gửi yêu cầu nâng cấp</span>
              </button>
            </form>
          )}

          <div className="text-center text-xs text-gray-500 border-t border-white/5 pt-4">
            Đăng nhập tài khoản Admin khác? <button onClick={handleLogout} className="text-emerald-400 hover:underline">Đăng xuất</button>
          </div>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP: ĐÃ LÀ CHỦ XE (OWNER) & ĐÃ VERIFIED
  return (
    <div className="min-h-screen bg-[#080b11] flex flex-col md:flex-row">
      {/* Sidebar Trái */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 p-6 flex flex-col justify-between gap-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-wider text-green-400">
            <Car className="h-7 w-7 text-green-500" />
            <span>DAT<span className="text-white">XE</span> Owner</span>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-3 mb-2 font-black">Chủ Xe</span>
            
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'overview' ? 'bg-green-500/10 text-green-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Activity className="h-4 w-4" />
              <span>Tổng Quan</span>
            </button>

            <button 
              onClick={() => setActiveTab('vehicles')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'vehicles' ? 'bg-green-500/10 text-green-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Car className="h-4 w-4" />
              <span>Xe Của Tôi ({myCars.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'requests' ? 'bg-green-500/10 text-green-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Calendar className="h-4 w-4" />
              <span>Yêu Cầu Thuê Xe ({bookingRequests.filter(r => r.status === 'PENDING').length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'chat' ? 'bg-green-500/10 text-green-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Hộp Thư Chat</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-white font-medium">{user.name}</span>
            <span className="text-[10px] text-green-400 font-semibold">Chủ xe đối tác</span>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 cursor-pointer">
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-12 overflow-y-auto max-w-7xl mx-auto w-full">

        {/* TAB 1: TỔNG QUAN */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Chào chủ xe, {user.name}!</h1>
              <p className="text-sm text-gray-400 mt-1">Hôm nay xe của bạn có một vài lịch đặt mới chờ duyệt.</p>
            </div>

            {/* KPIs */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Tổng thu nhập tích lũy</span>
                  <span className="text-2xl font-bold text-green-400 mt-1">{(earnings).toLocaleString()}đ</span>
                </div>
                <div className="h-10 w-10 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Số xe sở hữu</span>
                  <span className="text-2xl font-bold text-white mt-1">{myCars.length} Xe</span>
                </div>
                <div className="h-10 w-10 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Chuyến hoàn thành</span>
                  <span className="text-2xl font-bold text-white mt-1">{completedTrips} Chuyến</span>
                </div>
                <div className="h-10 w-10 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Recent pending requests */}
            <div className="glass-panel p-6 rounded-xl border border-white/5">
              <h3 className="font-bold text-white border-b border-white/5 pb-3 mb-4">Các yêu cầu đặt lịch thuê xe khẩn cấp</h3>
              {bookingRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có yêu cầu mới nào.</p>
              ) : (
                <div className="space-y-4">
                  {bookingRequests.filter(r => r.status === 'PENDING').map((r: any) => (
                    <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-white/2 border border-white/5 gap-4">
                      <div>
                        <strong className="text-white block">{r.vehicle.brand} {r.vehicle.model}</strong>
                        <span className="text-xs text-gray-400">Khách hàng: {r.customer.fullName} ({r.customer.phone})</span>
                        <span className="block text-xs text-gray-500 mt-1">Lịch thuê: {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleRequestStatus(r.id, 'CONFIRMED')}
                          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded text-xs transition cursor-pointer"
                        >
                          Duyệt
                        </button>
                        <button 
                          onClick={() => handleRequestStatus(r.id, 'CANCELLED')}
                          className="flex-1 sm:flex-none bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded text-xs transition cursor-pointer"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: XE CỦA TÔI */}
        {activeTab === 'vehicles' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white font-black">Danh sách phương tiện</h2>
              <button 
                onClick={() => router.push('/owner/add-car')}
                className="gradient-btn text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Đăng xe cho thuê</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCars.map((car) => (
                <div key={car.id} className="glass-panel rounded-xl overflow-hidden border border-white/5 flex flex-col group">
                  <div className="relative h-[180px]">
                    <img src={car.images[0]} alt={car.model} className="object-cover w-full h-full" />
                    <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded border ${
                      car.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {car.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bảo dưỡng/Khóa'}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-grow gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block uppercase font-medium">{car.brand}</span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{car.model}</h3>
                      <p className="text-xs text-gray-400 mt-1">Biển số: {car.plateNumber}</p>
                    </div>

                    <div className="text-sm text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Giá thuê:</span>
                        <span className="text-green-400 font-bold">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giới hạn Km/ngày:</span>
                        <span>{car.limitKmPerDay ? `${car.limitKmPerDay} km` : 'Không giới hạn'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => handleToggleCarStatus(car.id, car.status)}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          car.status === 'AVAILABLE' ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white' : 'bg-green-600 hover:bg-green-500 text-white'
                        }`}
                      >
                        {car.status === 'AVAILABLE' ? 'Bảo dưỡng xe' : 'Cho phép hoạt động'}
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Xác nhận xóa xe này khỏi hệ thống?')) {
                            api.vehicles.delete(car.id).then(() => loadOwnerData());
                          }
                        }}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: YÊU CẦU THUÊ XE */}
        {activeTab === 'requests' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white">Yêu Cầu Thuê Xe Gửi Tới</h2>

            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-white/2">
                  <tr>
                    <th className="px-6 py-4">Mã đơn</th>
                    <th className="px-6 py-4">Xe</th>
                    <th className="px-6 py-4">Khách hàng & SĐT</th>
                    <th className="px-6 py-4">Thời gian thuê</th>
                    <th className="px-6 py-4">Tổng tiền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookingRequests.map((b) => (
                    <tr key={b.id} className="hover:bg-white/1">
                      <td className="px-6 py-4"><strong className="text-white">{b.bookingNumber}</strong></td>
                      <td className="px-6 py-4">{b.vehicle.brand} {b.vehicle.model}</td>
                      <td className="px-6 py-4">
                        <span className="block text-white font-medium">{b.customer.fullName}</span>
                        <span className="text-xs text-gray-500">{b.customer.phone}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-green-400">{(b.totalPrice).toLocaleString()}đ</td>
                      <td className="px-6 py-4">
                        {b.status === 'PENDING' && <span className="text-amber-400 bg-amber-500/10 text-xs px-2 py-0.5 rounded border border-amber-500/20">Chờ duyệt</span>}
                        {b.status === 'CONFIRMED' && <span className="text-emerald-400 bg-emerald-500/10 text-xs px-2 py-0.5 rounded border border-emerald-500/20">Đã cọc</span>}
                        {b.status === 'RENTING' && <span className="text-emerald-400 bg-emerald-500/10 text-xs px-2 py-0.5 rounded border border-emerald-500/20">Đang đi</span>}
                        {b.status === 'COMPLETED' && <span className="text-green-400 bg-green-500/10 text-xs px-2 py-0.5 rounded border border-green-500/20">Hoàn thành</span>}
                        {b.status === 'CANCELLED' && <span className="text-red-400 bg-red-500/10 text-xs px-2 py-0.5 rounded border border-red-500/20">Đã hủy</span>}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {b.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleRequestStatus(b.id, 'CONFIRMED')}
                              className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                            >
                              Duyệt
                            </button>
                            <button 
                              onClick={() => handleRequestStatus(b.id, 'CANCELLED')}
                              className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs hover:bg-red-500 hover:text-white transition cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button 
                            onClick={() => handleRequestStatus(b.id, 'RENTING')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                          >
                            Giao xe
                          </button>
                        )}
                        {b.status === 'RENTING' && (
                          <button 
                            onClick={() => handleRequestStatus(b.id, 'COMPLETED')}
                            className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                          >
                            Nhận xe trả
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: HỘP THƯ CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-6 h-[600px] glass-panel border border-white/5 rounded-xl overflow-hidden">
            <div className="flex h-full">
              {/* Cột trái: danh sách đối tác chat */}
              <div className="w-1/3 border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5 font-bold text-white">Liên hệ gần đây</div>
                <div className="flex-grow overflow-y-auto divide-y divide-white/5">
                  {chatPartners.map((partner) => (
                    <button 
                      key={partner.id}
                      onClick={() => setSelectedPartner(partner)}
                      className={`w-full text-left p-4 hover:bg-white/2 transition block ${selectedPartner?.id === partner.id ? 'bg-white/5' : ''}`}
                    >
                      <div className="font-bold text-white">{partner.name}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{partner.email}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cột phải: khung chat */}
              <div className="w-2/3 flex flex-col h-full bg-[#0b0f19]">
                {selectedPartner ? (
                  <>
                    <div className="p-4 border-b border-white/5 font-bold text-white flex justify-between items-center">
                      <span>Đang nhắn với: {selectedPartner.name}</span>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
                      {chatHistory.map((chat, idx) => (
                        <div 
                          key={idx} 
                          className={`max-w-[70%] p-3 rounded-xl text-sm ${
                            chat.senderId === user.id 
                              ? 'bg-green-600 text-white self-end rounded-br-none' 
                              : 'bg-white/5 text-gray-300 self-start rounded-bl-none border border-white/5'
                          }`}
                        >
                          <p>{chat.message}</p>
                          <span className="text-[9px] text-gray-400 block mt-1 text-right">
                            {new Date(chat.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-2">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn phản hồi..."
                        className="flex-grow bg-gray-950 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-green-500 text-white" 
                      />
                      <button 
                        type="submit"
                        className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-gray-500 text-sm">
                    Hãy chọn một hội thoại ở cột bên trái để bắt đầu chat trực tuyến.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
