'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api, type AuthUser, type Booking, type ChatMessage, type ChatPartner, type Vehicle } from '@/lib/api';
import { io, type Socket } from 'socket.io-client';
import {
  Car, DollarSign, Calendar, MessageSquare,
  Check,
  Activity, Loader2, Plus, LogOut, Send
} from 'lucide-react';

export default function OwnerDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem('token'),
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'requests' | 'chat'>('overview');

  // Owner Data States
  const [myCars, setMyCars] = useState<Vehicle[]>([]);
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [completedTrips, setCompletedTrips] = useState(0);

  // Chat States
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const wsRef = useRef<Socket | null>(null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.replace('/auth');
  }, [router]);

  const loadOwnerData = useCallback(async () => {
    try {
      const [cars, requests, partners] = await Promise.all([
        api.vehicles.getMyCars(),
        api.bookings.getOwnerRequests(),
        api.chat.getPartners(),
      ]);
      setMyCars(cars);
      setBookingRequests(requests);
      setChatPartners(partners);

      const completed = requests.filter((request) => request.status === 'COMPLETED');
      setEarnings(completed.reduce((total, request) => total + request.totalPrice, 0));
      setCompletedTrips(completed.length);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu chủ xe', err);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      localStorage.setItem('user', JSON.stringify(me));
      if (me.role === 'OWNER' && me.isVerifiedOwner) {
        await loadOwnerData();
      } else {
        router.replace('/become-owner');
      }
    } catch (err) {
      console.error(err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, [handleLogout, loadOwnerData, router]);

  useEffect(() => {
    if (!token) {
      router.replace('/auth');
      return;
    }
    const authTimer = window.setTimeout(() => void fetchMe(), 0);
    return () => window.clearTimeout(authTimer);
  }, [fetchMe, router, token]);

  // Duyệt/Từ chối đơn đặt xe
  const handleRequestStatus = async (bookingId: string, status: string) => {
    try {
      await api.bookings.updateStatus(bookingId, status);
      await loadOwnerData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái đơn đặt.');
    }
  };

  // Đổi trạng thái xe
  const handleToggleCarStatus = async (carId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
      await api.vehicles.updateStatus(carId, newStatus);
      await loadOwnerData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái xe.');
    }
  };

  // Chat Real-time (Sử dụng WebSockets Gateway backend)
  useEffect(() => {
    if (selectedPartner && user) {
      const currentUserId = user.id;
      const partnerId = selectedPartner.id;
      // Load lịch sử chat
      api.chat.getHistory(partnerId).then((history) => {
        setChatHistory(history);
      });

      // Kết nối WebSocket trực tiếp tới backend Gateway
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
      const socket = io(wsUrl, {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket', 'polling'],
      });

      socket.on('messageReceived', (data: ChatMessage) => {
        if (
          (data.senderId === currentUserId && data.receiverId === partnerId) ||
          (data.senderId === partnerId && data.receiverId === currentUserId)
        ) {
          setChatHistory((prev) => [...prev, data]);
        }
      });

      wsRef.current = socket;

      return () => {
        socket.disconnect();
        wsRef.current = null;
      };
    }
  }, [selectedPartner, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner || !user) return;

    const payload = {
      receiverId: selectedPartner.id,
      message: newMessage,
    };

    if (wsRef.current?.connected) {
      wsRef.current.emit('sendMessage', payload);
    } else {
      // REST fallback vẫn lưu tin nhắn thật khi kết nối Socket.IO gián đoạn.
      try {
        const saved = await api.chat.sendMessage(payload.receiverId, payload.message);
        setChatHistory((prev) => [...prev, saved]);
      } catch (err) {
        console.error(err);
      }
    }
    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="dark min-h-screen bg-night-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <main className="dark flex min-h-dvh items-center justify-center bg-app-surface text-content-secondary">
        Đang chuyển đến trang đăng nhập…
      </main>
    );
  }

  // Tài khoản chưa được duyệt sẽ được đưa về đúng luồng đăng ký chủ xe.
  if (user?.role === 'CUSTOMER' || !user?.isVerifiedOwner) {
    return (
      <main className="dark flex min-h-dvh items-center justify-center bg-night-surface text-content-secondary">
        <Loader2 className="mr-3 h-6 w-6 animate-spin text-brand" />
        Đang chuyển đến trang đăng ký chủ xe…
      </main>
    );
  }

  // TRƯỜNG HỢP: ĐÃ LÀ CHỦ XE (OWNER) & ĐÃ VERIFIED
  return (
    <div className="dark min-h-screen bg-night-surface flex flex-col md:flex-row">
      {/* Sidebar Trái */}
      <aside className="w-full md:w-64 glass-panel border-r border-app-border/30 p-6 flex flex-col justify-between gap-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-wider text-brand">
            <Car className="h-7 w-7 text-brand" />
            <span>DAT<span className="text-content">XE</span> Owner</span>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="text-[10px] text-content-secondary uppercase tracking-widest font-bold px-3 mb-2 font-black">Chủ Xe</span>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'overview' ? 'bg-brand/10 text-brand font-semibold' : 'text-content-secondary hover:text-content'}`}
            >
              <Activity className="h-4 w-4" />
              <span>Tổng Quan</span>
            </button>

            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'vehicles' ? 'bg-brand/10 text-brand font-semibold' : 'text-content-secondary hover:text-content'}`}
            >
              <Car className="h-4 w-4" />
              <span>Xe Của Tôi ({myCars.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'requests' ? 'bg-brand/10 text-brand font-semibold' : 'text-content-secondary hover:text-content'}`}
            >
              <Calendar className="h-4 w-4" />
              <span>Yêu Cầu Thuê Xe ({bookingRequests.filter(r => r.status === 'PENDING').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'chat' ? 'bg-brand/10 text-brand font-semibold' : 'text-content-secondary hover:text-content'}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Hộp Thư Chat</span>
            </button>
          </div>
        </div>
        <Link href="/account" className="flex min-h-11 items-center justify-center rounded-xl border border-app-border/30 px-3 text-sm font-bold text-content-secondary transition hover:border-brand hover:text-brand">
          Thông tin tài khoản
        </Link>

        <div className="flex items-center justify-between border-t border-app-border/30 pt-4 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-content font-medium">{user.name}</span>
            <span className="text-[10px] text-brand font-semibold">Chủ xe đối tác</span>
          </div>
          <button onClick={handleLogout} className="text-content-secondary hover:text-danger cursor-pointer">
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
              <h1 className="text-3xl font-extrabold text-content">Chào chủ xe, {user.name}!</h1>
              <p className="text-sm text-content-secondary mt-1">Hôm nay xe của bạn có một vài lịch đặt mới chờ duyệt.</p>
            </div>

            {/* KPIs */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-xl border border-app-border/30 flex justify-between items-center">
                <div>
                  <span className="text-xs text-content-secondary block">Tổng thu nhập tích lũy</span>
                  <span className="text-2xl font-bold text-brand mt-1">{(earnings).toLocaleString()}đ</span>
                </div>
                <div className="h-10 w-10 bg-brand/10 border border-brand/35 text-brand rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-app-border/30 flex justify-between items-center">
                <div>
                  <span className="text-xs text-content-secondary block">Số xe sở hữu</span>
                  <span className="text-2xl font-bold text-content mt-1">{myCars.length} Xe</span>
                </div>
                <div className="h-10 w-10 bg-brand/10 border border-brand/35 text-brand rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-app-border/30 flex justify-between items-center">
                <div>
                  <span className="text-xs text-content-secondary block">Chuyến hoàn thành</span>
                  <span className="text-2xl font-bold text-content mt-1">{completedTrips} Chuyến</span>
                </div>
                <div className="h-10 w-10 bg-brand/10 border border-brand/35 text-brand rounded-lg flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Recent pending requests */}
            <div className="glass-panel p-6 rounded-xl border border-app-border/30">
              <h3 className="font-bold text-content border-b border-app-border/30 pb-3 mb-4">Các yêu cầu đặt lịch thuê xe khẩn cấp</h3>
              {bookingRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                <p className="text-sm text-content-secondary text-center py-4">Chưa có yêu cầu mới nào.</p>
              ) : (
                <div className="space-y-4">
                  {bookingRequests.filter(r => r.status === 'PENDING').map((r) => (
                    <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-app-muted/50 border border-app-border/30 gap-4">
                      <div>
                        <strong className="text-content block">{r.vehicle!.brand} {r.vehicle!.model}</strong>
                        <span className="text-xs text-content-secondary">Khách hàng: {r.customer!.fullName} ({r.customer!.phone})</span>
                        <span className="block text-xs text-content-secondary mt-1">Lịch thuê: {new Date(r.startDate!).toLocaleDateString()} - {new Date(r.endDate!).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleRequestStatus(r.id, 'CONFIRMED')}
                          className="flex-1 sm:flex-none bg-brand hover:bg-brand-hover text-on-brand font-bold px-3 py-1.5 rounded text-xs transition cursor-pointer"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleRequestStatus(r.id, 'CANCELLED')}
                          className="flex-1 sm:flex-none bg-danger-muted hover:bg-danger-muted text-danger hover:text-danger px-3 py-1.5 rounded text-xs transition cursor-pointer"
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
              <h2 className="text-2xl font-bold text-content font-black">Danh sách phương tiện</h2>
              <button
                onClick={() => router.push('/owner/add-car')}
                className="gradient-btn text-on-brand px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Đăng xe cho thuê</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCars.map((car) => (
                <div key={car.id} className="glass-panel rounded-xl overflow-hidden border border-app-border/30 flex flex-col group">
                  <div className="relative h-[180px]">
                    {car.images[0] ? <Image src={car.images[0]} alt={car.model} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" /> : <div className="flex h-full items-center justify-center bg-app-muted"><Car className="h-12 w-12 text-content-secondary" /></div>}
                    <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded border ${
                      car.status === 'AVAILABLE' ? 'bg-brand/10 text-brand border-brand/35' : 'bg-warning-muted text-warning border-warning/35'
                    }`}>
                      {car.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bảo dưỡng/Khóa'}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-grow gap-4">
                    <div>
                      <span className="text-xs text-content-secondary block uppercase font-medium">{car.brand}</span>
                      <h3 className="text-lg font-bold text-content mt-0.5">{car.model}</h3>
                      <p className="text-xs text-content-secondary mt-1">Biển số: {car.plateNumber}</p>
                    </div>

                    <div className="text-sm text-content-secondary space-y-1">
                      <div className="flex justify-between">
                        <span>Giá thuê:</span>
                        <span className="text-brand font-bold">{(car.dailyPrice).toLocaleString()}đ/ngày</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giới hạn Km/ngày:</span>
                        <span>{car.limitKmPerDay ? `${car.limitKmPerDay} km` : 'Không giới hạn'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button onClick={() => router.push(`/owner/vehicles/${car.id}/edit`)} className="rounded-lg bg-app-muted px-3 py-2 text-xs font-semibold text-content transition hover:bg-app-muted">Sửa</button>
                      <button
                        onClick={() => handleToggleCarStatus(car.id, car.status)}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          car.status === 'AVAILABLE' ? 'bg-warning-muted text-warning' : 'bg-brand hover:bg-brand-hover text-on-brand'
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
                        className="bg-danger-muted text-danger hover:bg-danger-muted hover:text-content px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition"
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
            <h2 className="text-2xl font-bold text-content">Yêu Cầu Thuê Xe Gửi Tới</h2>

            <div className="glass-panel rounded-xl border border-app-border/30 overflow-hidden">
              <table className="w-full text-sm text-left text-content-secondary">
                <thead className="text-xs text-content-secondary uppercase bg-app-muted/50">
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
                <tbody className="divide-y divide-app-border/30">
                  {bookingRequests.map((b) => (
                    <tr key={b.id} className="hover:bg-app-muted/40">
                      <td className="px-6 py-4"><strong className="text-content">{b.bookingNumber}</strong></td>
                      <td className="px-6 py-4">{b.vehicle!.brand} {b.vehicle!.model}</td>
                      <td className="px-6 py-4">
                        <span className="block text-content font-medium">{b.customer!.fullName}</span>
                        <span className="text-xs text-content-secondary">{b.customer!.phone}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(b.startDate!).toLocaleDateString()} - {new Date(b.endDate!).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-brand">{(b.totalPrice).toLocaleString()}đ</td>
                      <td className="px-6 py-4">
                        {b.status === 'PENDING' && <span className="text-warning bg-warning-muted text-xs px-2 py-0.5 rounded border border-warning/35">Chờ duyệt</span>}
                        {b.status === 'CONFIRMED' && <span className="text-brand bg-utility text-xs px-2 py-0.5 rounded border border-brand/35">Đã cọc</span>}
                        {b.status === 'RENTING' && <span className="text-brand bg-utility text-xs px-2 py-0.5 rounded border border-brand/35">Đang đi</span>}
                        {b.status === 'COMPLETED' && <span className="text-brand bg-brand/10 text-xs px-2 py-0.5 rounded border border-brand/35">Hoàn thành</span>}
                        {b.status === 'CANCELLED' && <span className="text-danger bg-danger-muted text-xs px-2 py-0.5 rounded border border-danger/35">Đã hủy</span>}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {b.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleRequestStatus(b.id, 'CONFIRMED')}
                              className="bg-brand hover:bg-brand-hover text-on-brand px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleRequestStatus(b.id, 'CANCELLED')}
                              className="bg-danger-muted text-danger px-2 py-1 rounded text-xs hover:bg-danger-muted hover:text-content transition cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleRequestStatus(b.id, 'RENTING')}
                            className="bg-brand px-2 py-1 text-xs font-semibold text-on-brand transition hover:bg-brand-hover cursor-pointer"
                          >
                            Giao xe
                          </button>
                        )}
                        {b.status === 'RENTING' && (
                          <button
                            onClick={() => handleRequestStatus(b.id, 'COMPLETED')}
                            className="bg-brand hover:bg-brand-hover text-on-brand px-2 py-1 rounded text-xs font-semibold cursor-pointer"
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
          <div className="flex flex-col gap-6 h-[600px] glass-panel border border-app-border/30 rounded-xl overflow-hidden">
            <div className="flex h-full">
              {/* Cột trái: danh sách đối tác chat */}
              <div className="w-1/3 border-r border-app-border/30 flex flex-col">
                <div className="p-4 border-b border-app-border/30 font-bold text-content">Liên hệ gần đây</div>
                <div className="flex-grow overflow-y-auto divide-y divide-app-border/30">
                  {chatPartners.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => setSelectedPartner(partner)}
                      className={`w-full text-left p-4 hover:bg-app-muted/50 transition block ${selectedPartner?.id === partner.id ? 'bg-app-muted/60' : ''}`}
                    >
                      <div className="font-bold text-content">{partner.name}</div>
                      <div className="text-xs text-content-secondary truncate mt-1">{partner.email}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cột phải: khung chat */}
              <div className="w-2/3 flex flex-col h-full bg-night-muted">
                {selectedPartner ? (
                  <>
                    <div className="p-4 border-b border-app-border/30 font-bold text-content flex justify-between items-center">
                      <span>Đang nhắn với: {selectedPartner.name}</span>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
                      {chatHistory.map((chat, idx) => (
                        <div
                          key={idx}
                          className={`max-w-[70%] p-3 rounded-xl text-sm ${
                            chat.senderId === user.id
                              ? 'bg-brand text-on-brand self-end rounded-br-none'
                              : 'bg-app-muted/60 text-content-secondary self-start rounded-bl-none border border-app-border/30'
                          }`}
                        >
                          <p>{chat.message}</p>
                          <span className="text-[9px] text-content-secondary block mt-1 text-right">
                            {new Date(chat.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-app-border/30 flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn phản hồi..."
                        className="flex-grow bg-app-surface border border-app-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand text-content"
                      />
                      <button
                        type="submit"
                        className="bg-brand hover:bg-brand-hover text-on-brand p-2 rounded-lg transition cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-content-secondary text-sm">
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
