'use client';

import React, { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import OverviewCards from '@/components/dashboard/OverviewCards';
import StatusCards from '@/components/dashboard/StatusCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import NotificationCarousel from '@/components/dashboard/NotificationCarousel';
import TopServicesChart from '@/components/dashboard/TopServicesChart';
import TopCarsTable from '@/components/dashboard/TopCarsTable';
import RatingModal from '@/components/dashboard/modals/RatingModal';
import CarStatusModal from '@/components/dashboard/modals/CarStatusModal';
import { 
  Calendar, ShieldAlert, Award, FileSpreadsheet, Sparkles, TrendingUp, ChevronRight
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

export default function DashboardHome() {
  const toast = useToast();

  // Selected Month for Revenue chart
  const [selectedMonth, setSelectedMonth] = useState('2026-06');

  // API Data States
  const [overviewToday, setOverviewToday] = useState<any>(null);
  const [overviewThisMonth, setOverviewThisMonth] = useState<any>(null);
  const [overviewLastMonth, setOverviewLastMonth] = useState<any>(null);
  const [carStatusSummary, setCarStatusSummary] = useState<any>(null);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [topServicesData, setTopServicesData] = useState<any[]>([]);
  const [topCarsData, setTopCarsData] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  // Expiring & Fines Counts
  const [expiringCarsCount, setExpiringCarsCount] = useState(2);
  const [totalCarsCount, setTotalCarsCount] = useState(10);
  const [solvedFines, setSolvedFines] = useState(12);
  const [totalFines, setTotalFines] = useState(14);

  // Modals States
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isCarStatusOpen, setIsCarStatusOpen] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth]);

  // Load satisfaction modal after 5 seconds automatically to wow the user
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRatingOpen(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        today,
        thisMonth,
        lastMonth,
        statusSummary,
        revenue,
        services,
        carsList,
        noticesList,
      ] = await Promise.all([
        dashboardApi.getOverview('today'),
        dashboardApi.getOverview('this_month'),
        dashboardApi.getOverview('last_month'),
        dashboardApi.getCarStatusSummary(),
        dashboardApi.getRevenueChart(selectedMonth),
        dashboardApi.getTopServices(),
        dashboardApi.getTopCars(10),
        dashboardApi.getNotifications(5),
      ]);

      setOverviewToday(today);
      setOverviewThisMonth(thisMonth);
      setOverviewLastMonth(lastMonth);
      setCarStatusSummary(statusSummary);
      setRevenueChartData(revenue);
      setTopServicesData(services);
      setTopCarsData(carsList);
      setNotices(noticesList);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard', err);
      toast.error('Không thể đồng bộ dữ liệu thống kê từ máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return Math.round((value / total) * 100) + '%';
  };

  return (
    <div className="flex flex-col gap-6 select-none pb-10">
      
      {/* Top Welcome Title Banner */}
      <div className="flex justify-between items-center bg-[#1e1e2d] border border-[#2b2b40] p-6 rounded-2xl text-white">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
            <span>Chào mừng quay trở lại, Chủ xe đối tác!</span>
            <Sparkles className="h-5 w-5 text-amber-400 fill-current animate-pulse" />
          </h2>
          <span className="text-xs text-gray-500 font-semibold">
            Bảng điều khiển quản trị hạm đội xe G-Car của bạn. Tất cả thống kê tự động đồng bộ theo thời gian thực.
          </span>
        </div>
        <button
          onClick={() => setIsRatingOpen(true)}
          className="hidden md:flex items-center gap-1.5 bg-[#00B14F] hover:bg-[#009b45] text-white px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
        >
          <span>Đánh giá dịch vụ</span>
        </button>
      </div>

      {/* Loading Skeleton fallback block */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <span className="h-8 w-8 rounded-full border-4 border-gray-300 border-t-[#00B14F] animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider">Đang cập nhật chỉ số...</span>
        </div>
      ) : (
        <>
          {/* Row 1: 3 Overview Cards */}
          <OverviewCards 
            today={overviewToday}
            thisMonth={overviewThisMonth}
            lastMonth={overviewLastMonth}
          />

          {/* Row 2: 6 Status Cards */}
          <StatusCards counts={carStatusSummary} />

          {/* Row 3: Bi-column Revenue Chart + Side Alerts widgets */}
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            {/* Chart Widget (8/12) */}
            <div className="lg:col-span-8">
              <RevenueChart 
                data={revenueChartData} 
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            </div>

            {/* Sub-cards alerts column (4/12) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Carousel Notifications (Sub-card 1) */}
              <div className="flex-1 min-h-[150px]">
                <NotificationCarousel notices={notices} />
              </div>

              {/* Due Date Alert Widget (Sub-card 2) */}
              <div 
                onClick={() => setIsCarStatusOpen(true)}
                className="bg-white dark:bg-gray-900 border border-red-200/40 dark:border-white/5 hover:border-red-400 p-5 rounded-2xl shadow-xs flex items-center gap-4 transition duration-200 cursor-pointer hover:scale-[1.01]"
              >
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <Calendar className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Xe đến hạn</h4>
                  <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Danh sách bảo hiểm/đăng kiểm</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {expiringCarsCount}/{totalCarsCount} xe
                    </span>
                    <span className="bg-red-500/10 text-red-500 font-extrabold text-[9px] px-1.5 py-0.5 rounded-sm">
                      {getPercentage(expiringCarsCount, totalCarsCount)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>

              {/* Violation Traffic Fines Widget (Sub-card 3) */}
              <div 
                onClick={() => toast.warning('Chi tiết phạt nguội đang đồng bộ từ Cục CSGT!')}
                className="bg-white dark:bg-gray-900 border border-red-200/40 dark:border-white/5 hover:border-red-400 p-5 rounded-2xl shadow-xs flex items-center gap-4 transition duration-200 cursor-pointer hover:scale-[1.01]"
              >
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <ShieldAlert className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Phạt nguội</h4>
                  <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Danh sách lỗi chưa xử lý</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {solvedFines}/{totalFines} đã xong
                    </span>
                    <span className="bg-emerald-500/10 text-[#00B14F] font-extrabold text-[9px] px-1.5 py-0.5 rounded-sm">
                      {getPercentage(solvedFines, totalFines)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Row 4: Bi-column Services Donut + Top Cars Table list */}
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            {/* Top services Pie/Donut (4/12) */}
            <div className="lg:col-span-4">
              <TopServicesChart data={topServicesData} />
            </div>

            {/* Top vehicles Table (8/12) */}
            <div className="lg:col-span-8">
              <TopCarsTable cars={topCarsData} />
            </div>
          </div>
        </>
      )}

      {/* Global popup modals */}
      <RatingModal 
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
      />
      <CarStatusModal 
        isOpen={isCarStatusOpen}
        onClose={() => setIsCarStatusOpen(false)}
      />
    </div>
  );
}
