'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  BarChart3, Car, Calendar, Users, Wrench, DollarSign, 
  Plus, Search, LogOut, Check, X, ShieldAlert, Award, FileText,
  Activity, ArrowUpRight, CheckCircle2, AlertTriangle, Play, Loader2, MessageSquare
} from 'lucide-react';

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  // Login Form States
  const [email, setEmail] = useState('admin@datxe.linuxunity.com');
  const [password, setPassword] = useState('adminpassword123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'bookings' | 'customers' | 'maintenance' | 'financial' | 'owner-requests' | 'support-tickets'>('overview');

  // SaaS Data States
  const [stats, setStats] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any[]>([]);
  const [topVehicles, setTopVehicles] = useState<any>(null);
  const [ownerRequests, setOwnerRequests] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);


  // Form states for Create/Edit Vehicle
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(2023);
  const [seats, setSeats] = useState(5);
  const [transmission, setTransmission] = useState('AUTO');
  const [fuel, setFuel] = useState('GASOLINE');
  const [color, setColor] = useState('Đen');
  const [dailyPrice, setDailyPrice] = useState(800000);
  const [weekendPrice, setWeekendPrice] = useState(1000000);
  const [holidayPrice, setHolidayPrice] = useState(1200000);
  const [penaltyRate, setPenaltyRate] = useState(100000);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80');

  // CRM edit state
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [crmSegment, setCrmSegment] = useState('');
  const [crmNotes, setCrmNotes] = useState('');

  // Maintenance complete state
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [maintenanceCost, setMaintenanceCost] = useState(500000);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        fetchMe();
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, activeTab]);

  const fetchMe = async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      handleLogout();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('token', res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    } catch (err: any) {
      setLoginError(err.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const loadDashboardData = async () => {
    try {
      if (activeTab === 'overview') {
        const dStats = await api.analytics.dashboard();
        setStats(dStats);
        const top = await api.analytics.topVehicles();
        setTopVehicles(top);
      } else if (activeTab === 'vehicles') {
        const list = await api.vehicles.findAll();
        setVehicles(list);
      } else if (activeTab === 'bookings') {
        const list = await api.bookings.findAll();
        setBookings(list);
      } else if (activeTab === 'customers') {
        const list = await api.customers.findAll();
        setCustomers(list);
      } else if (activeTab === 'maintenance') {
        const alerts = await api.maintenance.getAlerts();
        setMaintenanceAlerts(alerts);
      } else if (activeTab === 'financial') {
        const report = await api.analytics.financial();
        setFinancials(report);
      } else if (activeTab === 'owner-requests') {
        const list = await api.auth.getOwnerRequests();
        setOwnerRequests(list);
      } else if (activeTab === 'support-tickets') {
        const list = await api.tickets.findAll();
        setSupportTickets(list);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu dashboard', err);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        plateNumber, brand, model, year, seats, transmission, fuel, color,
        dailyPrice, weekendPrice, holidayPrice, penaltyRate,
        images: [imageUrl],
      };
      await api.vehicles.create(payload);
      setShowAddVehicle(false);
      // Reset form
      setPlateNumber(''); setBrand(''); setModel('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm xe mới.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await api.bookings.updateStatus(bookingId, status);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái đặt xe.');
    }
  };

  const handleUpdateCRM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await api.customers.update(selectedCustomer.id, crmSegment, crmNotes);
      setSelectedCustomer(null);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật CRM.');
    }
  };

  const handleCompleteMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    try {
      await api.maintenance.complete(selectedAlert.id, maintenanceCost);
      setSelectedAlert(null);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Lỗi ghi nhận hoàn thành bảo dưỡng.');
    }
  };
  const handleVerifyOwner = async (userId: string, approve: boolean) => {
    try {
      await api.auth.verifyOwner(userId, approve);
      const list = await api.auth.getOwnerRequests();
      setOwnerRequests(list);
    } catch (err: any) {
      alert(err.message || 'Lỗi xử lý duyệt yêu cầu.');
    }
  };

  const [replyText, setReplyText] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    try {
      await api.tickets.reply(selectedTicket.id, replyText);
      setSelectedTicket(null);
      setReplyText('');
      const list = await api.tickets.findAll();
      setSupportTickets(list);
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi phản hồi ticket.');
    }
  };

  // NẾU CHƯA ĐĂNG NHẬP - HIỂN THỊ TRANG LOGIN SANG TRỌNG
  if (!token) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center px-6">
        <div className="max-w-md w-full glass-panel border border-white/5 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white flex justify-center items-center gap-2">
              <Car className="h-8 w-8 text-purple-500" />
              <span>DAT<span className="text-purple-400">XE</span> Dashboard</span>
            </h1>
            <p className="text-xs text-gray-400 mt-2">Hệ thống quản trị và kiểm soát kinh doanh cho thuê xe tự lái</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Tài khoản Email</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@datxe.linuxunity.com"
                className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500 text-white" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Mật khẩu</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500 text-white" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full gradient-btn text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Đăng nhập hệ thống</span>
            </button>
          </form>
          
          <div className="text-[11px] text-gray-500 text-center border-t border-white/5 pt-4">
            Mặc định: <strong className="text-purple-400">admin@datxe.linuxunity.com</strong> mật khẩu: <strong className="text-purple-400">adminpassword123</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] flex flex-col md:flex-row">
      {/* Sidebar Trái */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 p-6 flex flex-col justify-between gap-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-wider text-purple-400">
            <Car className="h-7 w-7 text-purple-500" />
            <span>DAT<span className="text-white">XE</span></span>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-3 mb-2">Quản trị</span>
            
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'overview' ? 'bg-purple-500/10 text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Tổng Quan</span>
            </button>

            <button 
              onClick={() => setActiveTab('vehicles')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'vehicles' ? 'bg-purple-500/10 text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Car className="h-4 w-4" />
              <span>Quản Lý Xe</span>
            </button>

            <button 
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'bookings' ? 'bg-purple-500/10 text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Calendar className="h-4 w-4" />
              <span>Quản Lý Đặt Xe</span>
            </button>

            <button 
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'customers' ? 'bg-purple-500/10 text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Users className="h-4 w-4" />
              <span>Khách Hàng (CRM)</span>
            </button>

            <button 
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'maintenance' ? 'bg-purple-500/10 text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Wrench className="h-4 w-4" />
              <span>Lịch Bảo Dưỡng</span>
            </button>

            <button 
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'financial' ? 'bg-purple-500/10 text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <FileText className="h-4 w-4" />
              <span>Báo Cáo Tài Chính</span>
            </button>

            <button 
              onClick={() => setActiveTab('owner-requests')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'owner-requests' ? 'bg-purple-500/10 text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Award className="h-4 w-4" />
              <span>Duyệt Chủ Xe ({ownerRequests.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('support-tickets')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'support-tickets' ? 'bg-purple-500/10 text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Tickets Hỗ Trợ ({supportTickets.filter(t => t.status === 'OPEN').length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-white font-medium">{user?.name || 'Nhân viên'}</span>
            <span className="text-[10px] text-purple-400 font-semibold">{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 cursor-pointer">
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-12 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* TAB 1: TỔNG QUAN */}
        {activeTab === 'overview' && stats && (
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-extrabold text-white">Xin chào, {user?.name}!</h1>
              <p className="text-sm text-gray-400 mt-1">Dưới đây là hiệu suất kinh doanh thời gian thực của đội xe hôm nay.</p>
            </div>

            {/* KPIs Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Doanh thu tháng này</span>
                  <span className="text-2xl font-bold text-white mt-1">{(stats.revenueMonth).toLocaleString()}đ</span>
                </div>
                <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Xe đang cho thuê</span>
                  <span className="text-2xl font-bold text-white mt-1">{stats.vehicleStats.rented} / {stats.vehicleStats.total} xe</span>
                </div>
                <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Tỷ lệ lấp đầy (30 ngày)</span>
                  <span className="text-2xl font-bold text-purple-400 mt-1">{stats.occupancyRate}%</span>
                </div>
                <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 animate-pulse" />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 block">Đơn đặt xe hôm nay</span>
                  <span className="text-2xl font-bold text-white mt-1">{stats.bookingsToday} Đơn</span>
                </div>
                <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Top Vehicles list */}
            {topVehicles && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Doanh thu cao nhất */}
                <div className="glass-panel p-6 rounded-xl border border-white/5">
                  <h3 className="font-bold text-white border-b border-white/5 pb-3 mb-4">Top 5 xe doanh thu cao nhất</h3>
                  <div className="space-y-4">
                    {topVehicles.topRevenue.map((v: any, index: number) => (
                      <div key={v.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-purple-500/20 text-purple-400 w-5 h-5 rounded flex items-center justify-center font-bold">{index + 1}</span>
                          <div>
                            <span className="font-bold text-white block">{v.brand} {v.model}</span>
                            <span className="text-[10px] text-gray-500">{v.plateNumber}</span>
                          </div>
                        </div>
                        <span className="font-semibold text-purple-400">{(v.revenue).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tần suất thuê nhiều nhất */}
                <div className="glass-panel p-6 rounded-xl border border-white/5">
                  <h3 className="font-bold text-white border-b border-white/5 pb-3 mb-4">Top 5 xe tần suất thuê cao nhất</h3>
                  <div className="space-y-4">
                    {topVehicles.topFrequency.map((v: any, index: number) => (
                      <div key={v.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-purple-500/20 text-purple-400 w-5 h-5 rounded flex items-center justify-center font-bold">{index + 1}</span>
                          <div>
                            <span className="font-bold text-white block">{v.brand} {v.model}</span>
                            <span className="text-[10px] text-gray-500">{v.plateNumber}</span>
                          </div>
                        </div>
                        <span className="font-semibold text-white">{v.frequency} Lượt thuê</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUẢN LÝ XE */}
        {activeTab === 'vehicles' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Quản Lý Xe Đội Ngũ</h2>
              <button 
                onClick={() => setShowAddVehicle(!showAddVehicle)}
                className="gradient-btn text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm xe mới</span>
              </button>
            </div>

            {showAddVehicle && (
              <form onSubmit={handleCreateVehicle} className="glass-panel p-6 rounded-xl border border-white/5 grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Hãng xe</label>
                  <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Hyundai" className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Dòng xe (Model)</label>
                  <input type="text" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="Accent" className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Biển số xe</label>
                  <input type="text" required value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="30A-123.45" className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Năm SX</label>
                  <input type="number" required value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Số ghế</label>
                  <input type="number" required value={seats} onChange={(e) => setSeats(parseInt(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Giá thuê ngày thường</label>
                  <input type="number" required value={dailyPrice} onChange={(e) => setDailyPrice(parseInt(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Giá cuối tuần</label>
                  <input type="number" required value={weekendPrice} onChange={(e) => setWeekendPrice(parseInt(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Giá ngày lễ</label>
                  <input type="number" required value={holidayPrice} onChange={(e) => setHolidayPrice(parseInt(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phạt quá giờ/h</label>
                  <input type="number" required value={penaltyRate} onChange={(e) => setPenaltyRate(parseInt(e.target.value))} className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">Ảnh xe URL (hoặc để mặc định)</label>
                  <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-xs transition cursor-pointer">Lưu xe mới</button>
                </div>
              </form>
            )}

            {/* List Cars Table */}
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-white/2">
                  <tr>
                    <th className="px-6 py-4">Xe & Biển số</th>
                    <th className="px-6 py-4">Số ghế</th>
                    <th className="px-6 py-4">Giá thuê chuẩn</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vehicles.map((car) => (
                    <tr key={car.id} className="hover:bg-white/1">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={car.images[0]} alt={car.model} className="w-12 h-9 object-cover rounded border border-white/10" />
                        <div>
                          <strong className="text-white block">{car.brand} {car.model}</strong>
                          <span className="text-xs text-gray-500">{car.plateNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{car.seats} Ghế</td>
                      <td className="px-6 py-4 font-semibold text-purple-400">{(car.dailyPrice).toLocaleString()}đ/ngày</td>
                      <td className="px-6 py-4">
                        {car.status === 'AVAILABLE' && <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded border border-green-500/20">Sẵn sàng</span>}
                        {car.status === 'RENTED' && <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded border border-purple-500/20">Đang thuê</span>}
                        {car.status === 'MAINTENANCE' && <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/20">Bảo dưỡng</span>}
                        {car.status === 'LOCKED' && <span className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/20">Đã khóa</span>}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {car.status === 'AVAILABLE' ? (
                          <button 
                            onClick={() => api.vehicles.updateStatus(car.id, 'LOCKED').then(() => loadDashboardData())}
                            className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs hover:bg-red-500 hover:text-white transition cursor-pointer"
                          >
                            Khóa
                          </button>
                        ) : (
                          <button 
                            onClick={() => api.vehicles.updateStatus(car.id, 'AVAILABLE').then(() => loadDashboardData())}
                            className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs hover:bg-green-500 hover:text-white transition cursor-pointer"
                          >
                            Mở khóa
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            if(confirm('Xác nhận xóa xe này?')) {
                              api.vehicles.delete(car.id).then(() => loadDashboardData());
                            }
                          }}
                          className="text-gray-500 hover:text-red-400 transition cursor-pointer text-xs"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white">Quản Lý Danh Sách Đặt Xe</h2>

            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-white/2">
                  <tr>
                    <th className="px-6 py-4">Mã đơn</th>
                    <th className="px-6 py-4">Khách thuê & SĐT</th>
                    <th className="px-6 py-4">Xe</th>
                    <th className="px-6 py-4">Khoảng thời gian</th>
                    <th className="px-6 py-4">Tổng tiền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/1">
                      <td className="px-6 py-4">
                        <strong className="text-white">{b.bookingNumber}</strong>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block text-white font-medium">{b.customer.fullName}</span>
                        <span className="text-xs text-gray-500">{b.customer.phone}</span>
                      </td>
                      <td className="px-6 py-4">{b.vehicle.brand} {b.vehicle.model}</td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(b.startDate).toLocaleDateString('vi-VN')} - {new Date(b.endDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-purple-400">{(b.totalPrice).toLocaleString()}đ</td>
                      <td className="px-6 py-4">
                        {b.status === 'PENDING' && <span className="text-amber-400 bg-amber-500/10 text-xs px-2 py-0.5 rounded border border-amber-500/20">Chờ duyệt</span>}
                        {b.status === 'CONFIRMED' && <span className="text-blue-400 bg-blue-500/10 text-xs px-2 py-0.5 rounded border border-blue-500/20">Đã cọc</span>}
                        {b.status === 'RENTING' && <span className="text-purple-400 bg-purple-500/10 text-xs px-2 py-0.5 rounded border border-purple-500/20">Đang đi</span>}
                        {b.status === 'COMPLETED' && <span className="text-green-400 bg-green-500/10 text-xs px-2 py-0.5 rounded border border-green-500/20">Hoàn thành</span>}
                        {b.status === 'CANCELLED' && <span className="text-red-400 bg-red-500/10 text-xs px-2 py-0.5 rounded border border-red-500/20">Đã hủy</span>}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {b.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleUpdateBookingStatus(b.id, 'CONFIRMED')}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                            >
                              Duyệt cọc
                            </button>
                            <button 
                              onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                              className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs hover:bg-red-500 hover:text-white transition cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button 
                            onClick={() => handleUpdateBookingStatus(b.id, 'RENTING')}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                          >
                            Giao xe
                          </button>
                        )}
                        {b.status === 'RENTING' && (
                          <button 
                            onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                            className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                          >
                            Nhận trả xe
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

        {/* TAB 4: CRM KHÁCH HÀNG */}
        {activeTab === 'customers' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white">Quản Lý Thông Tin Khách Hàng (CRM)</h2>

            {selectedCustomer && (
              <form onSubmit={handleUpdateCRM} className="glass-panel p-6 rounded-xl border border-purple-500/20 flex flex-col gap-4">
                <h3 className="font-bold text-white">Chỉnh sửa CRM cho: {selectedCustomer.fullName}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Phân loại khách hàng</label>
                    <select 
                      value={crmSegment} 
                      onChange={(e) => setCrmSegment(e.target.value)}
                      className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="REGULAR">Thành viên thường (REGULAR)</option>
                      <option value="VIP">Khách hàng VIP (VIP)</option>
                      <option value="BLACKLIST">Khóa/Danh sách đen (BLACKLIST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Ghi chú trao đổi / Lịch sử liên hệ</label>
                    <input 
                      type="text" 
                      value={crmNotes} 
                      onChange={(e) => setCrmNotes(e.target.value)}
                      className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white focus:outline-none"
                      placeholder="Khách quen, giữ gìn xe sạch sẽ..." 
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded text-xs cursor-pointer">Hủy</button>
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer">Cập nhật CRM</button>
                </div>
              </form>
            )}

            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-white/2">
                  <tr>
                    <th className="px-6 py-4">Họ tên & SĐT</th>
                    <th className="px-6 py-4">Tổng lượt thuê</th>
                    <th className="px-6 py-4">Tổng chi tiêu</th>
                    <th className="px-6 py-4">Phân khúc</th>
                    <th className="px-6 py-4">Ghi chú CRM</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-white/1">
                      <td className="px-6 py-4">
                        <strong className="text-white block">{c.fullName}</strong>
                        <span className="text-xs text-gray-500">{c.phone}</span>
                      </td>
                      <td className="px-6 py-4 font-bold">{c.totalBookings} Lượt</td>
                      <td className="px-6 py-4 text-purple-400 font-semibold">{(c.totalRevenue).toLocaleString()}đ</td>
                      <td className="px-6 py-4">
                        {c.segment === 'VIP' && <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded border border-purple-500/20 font-bold flex items-center gap-1 w-fit"><Award className="h-3 w-3" /> VIP</span>}
                        {c.segment === 'REGULAR' && <span className="bg-gray-500/10 text-gray-300 text-xs px-2 py-0.5 rounded border border-white/10 w-fit">Thường</span>}
                        {c.segment === 'BLACKLIST' && <span className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/20 font-bold flex items-center gap-1 w-fit"><ShieldAlert className="h-3 w-3" /> Blacklist</span>}
                      </td>
                      <td className="px-6 py-4 text-xs truncate max-w-[200px]">{c.notes || '---'}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCrmSegment(c.segment);
                            setCrmNotes(c.notes || '');
                          }}
                          className="bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white px-3 py-1 rounded text-xs transition cursor-pointer"
                        >
                          CRM Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: LỊCH BẢO DƯỠNG */}
        {activeTab === 'maintenance' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white">Nhắc Nhở Bảo Dưỡng & Cảnh Báo Sắp Hạn</h2>

            {selectedAlert && (
              <form onSubmit={handleCompleteMaintenance} className="glass-panel p-6 rounded-xl border border-green-500/20 flex flex-col gap-4">
                <h3 className="font-bold text-white">Hoàn thành bảo dưỡng xe: {selectedAlert.plateNumber}</h3>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Tổng chi phí thực tế (VND)</label>
                  <input 
                    type="number" 
                    value={maintenanceCost} 
                    onChange={(e) => setMaintenanceCost(parseInt(e.target.value))}
                    className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white focus:outline-none" 
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setSelectedAlert(null)} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded text-xs cursor-pointer">Hủy</button>
                  <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer">Xác nhận hoàn thành</button>
                </div>
              </form>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {maintenanceAlerts.length === 0 ? (
                <div className="md:col-span-2 glass-panel p-8 text-center text-gray-400 rounded-xl border border-white/5">
                  ✅ Hiện tại không có cảnh báo bảo dưỡng nào đến hạn trong 7 ngày tới.
                </div>
              ) : (
                maintenanceAlerts.map((m) => (
                  <div key={m.id} className="glass-panel p-6 rounded-xl border border-white/5 flex gap-4 items-start">
                    <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-white block">{m.brand} {m.model}</strong>
                          <span className="text-xs text-gray-500">Biển số: {m.plateNumber}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.daysRemaining <= 0 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {m.daysRemaining <= 0 ? `Quá hạn ${Math.abs(m.daysRemaining)} ngày` : `Còn ${m.daysRemaining} ngày`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">Loại nhắc nhở: <strong className="text-white">{m.type}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Mô tả: {m.description || '---'}</p>
                      
                      <button 
                        onClick={() => {
                          setSelectedAlert(m);
                          setMaintenanceCost(500000);
                        }}
                        className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-3 py-1 rounded text-xs transition mt-4 font-semibold cursor-pointer"
                      >
                        Bảo dưỡng xong
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: BÁO CÁO TÀI CHÍNH CHI TIẾT */}
        {activeTab === 'financial' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white">Báo Cáo Tài Chính & Lợi Nhuận Từng Xe</h2>

            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-white/2">
                  <tr>
                    <th className="px-6 py-4">Xe & Biển số</th>
                    <th className="px-6 py-4">Doanh thu</th>
                    <th className="px-6 py-4">Chi phí Bảo dưỡng</th>
                    <th className="px-6 py-4">Chi phí khác/Khấu hao</th>
                    <th className="px-6 py-4">Tỷ lệ lấp đầy</th>
                    <th className="px-6 py-4 text-right">Lợi nhuận ròng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {financials.map((f) => (
                    <tr key={f.vehicleId} className="hover:bg-white/1">
                      <td className="px-6 py-4">
                        <strong className="text-white block">{f.brand} {f.model}</strong>
                        <span className="text-xs text-gray-500">{f.plateNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-green-400 font-semibold">{(f.revenue).toLocaleString()}đ</td>
                      <td className="px-6 py-4 text-amber-500">{(f.maintenanceCost).toLocaleString()}đ</td>
                      <td className="px-6 py-4 text-gray-500">{(f.otherExpense).toLocaleString()}đ</td>
                      <td className="px-6 py-4 font-bold text-purple-400">{f.occupancyRate}%</td>
                      <td className="px-6 py-4 text-right font-black text-white">
                        <span className={f.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {(f.netProfit).toLocaleString()}đ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: DUYỆT CHỦ XE */}
        {activeTab === 'owner-requests' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white">Yêu Cầu Đăng Ký Chủ Xe Chờ Duyệt</h2>
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-white/2">
                  <tr>
                    <th className="px-6 py-4">Tên người dùng</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">SĐT</th>
                    <th className="px-6 py-4">Số CCCD</th>
                    <th className="px-6 py-4 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ownerRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">Không có yêu cầu nâng cấp chủ xe nào.</td>
                    </tr>
                  ) : (
                    ownerRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-white/1">
                        <td className="px-6 py-4 font-bold text-white">{req.name}</td>
                        <td className="px-6 py-4">{req.email}</td>
                        <td className="px-6 py-4">{req.phone || 'Chưa cập nhật'}</td>
                        <td className="px-6 py-4">{req.idCardNo || 'Chưa cập nhật'}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => handleVerifyOwner(req.id, true)}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button 
                            onClick={() => handleVerifyOwner(req.id, false)}
                            className="bg-red-500/10 text-red-400 px-3 py-1 rounded text-xs hover:bg-red-500 hover:text-white transition cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: TICKETS HỖ TRỢ */}
        {activeTab === 'support-tickets' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white">Tickets Khiếu Nại & Hỗ Trợ Từ Khách Hàng</h2>

            {selectedTicket && (
              <form onSubmit={handleReplyTicket} className="glass-panel p-6 rounded-xl border border-purple-500/20 flex flex-col gap-4">
                <h3 className="font-bold text-white">Trả lời Ticket: {selectedTicket.subject}</h3>
                <div className="text-xs text-gray-400 p-3 bg-white/2 rounded border border-white/5">
                  <p><strong>Khách hàng:</strong> {selectedTicket.user.name} ({selectedTicket.user.email})</p>
                  <p className="mt-1"><strong>Nội dung:</strong> {selectedTicket.message}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Nội dung phản hồi</label>
                  <textarea 
                    rows={3} 
                    required
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded py-2 px-3 text-xs text-white focus:outline-none"
                    placeholder="Nhập nội dung phản hồi của hệ thống..." 
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setSelectedTicket(null); setReplyText(''); }} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded text-xs cursor-pointer">Hủy</button>
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer">Gửi Phản Hồi</button>
                </div>
              </form>
            )}

            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-white/2">
                  <tr>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Chủ đề</th>
                    <th className="px-6 py-4">Tin nhắn</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Phản hồi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {supportTickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">Không có ticket hỗ trợ nào.</td>
                    </tr>
                  ) : (
                    supportTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-white/1">
                        <td className="px-6 py-4">
                          <strong className="text-white block">{t.user.name}</strong>
                          <span className="text-[10px] text-gray-500">{t.user.email}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">{t.subject}</td>
                        <td className="px-6 py-4 text-xs truncate max-w-[200px]">{t.message}</td>
                        <td className="px-6 py-4">
                          {t.status === 'OPEN' ? (
                            <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/20 font-bold">Chưa xử lý</span>
                          ) : (
                            <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded border border-green-500/20 font-bold">Đã xử lý</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedTicket(t)}
                            className="bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white px-3 py-1 rounded text-xs transition cursor-pointer"
                          >
                            Phản hồi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
