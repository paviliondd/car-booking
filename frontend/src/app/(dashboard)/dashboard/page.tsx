'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard';
import OverviewCards from '@/components/dashboard/OverviewCards';
import StatusCards from '@/components/dashboard/StatusCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import NotificationCarousel from '@/components/dashboard/NotificationCarousel';
import TopServicesChart from '@/components/dashboard/TopServicesChart';
import TopCarsTable from '@/components/dashboard/TopCarsTable';
import RatingModal from '@/components/dashboard/modals/RatingModal';
import CarStatusModal from '@/components/dashboard/modals/CarStatusModal';
import { useToast } from '@/providers/ToastProvider';

type Overview = {
  totalContract: number;
  totalMoneyContract: number;
  totalMoneyForward: number;
  totalCollect: number;
  totalExpense: number;
};

type CarStatusSummary = {
  waitConfirm: number;
  confirmed: number;
  received: number;
  returned: number;
  accident: number;
  pledged: number;
};

type RevenuePoint = {
  date: string;
  revenue: number;
};

type TopService = {
  name: string;
  value: number;
};

type TopCar = {
  name: string;
  bookingsCount: number;
  revenue: number;
  maxRevenue: number;
};

type Notice = {
  id: string;
  title: string;
  desc: string;
  date: string;
};

export default function DashboardHome() {
  const { error: showError, warning: showWarning } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [overviewToday, setOverviewToday] = useState<Overview | null>(null);
  const [overviewThisMonth, setOverviewThisMonth] = useState<Overview | null>(null);
  const [overviewLastMonth, setOverviewLastMonth] = useState<Overview | null>(null);
  const [carStatusSummary, setCarStatusSummary] = useState<CarStatusSummary | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<RevenuePoint[]>([]);
  const [topServicesData, setTopServicesData] = useState<TopService[]>([]);
  const [topCarsData, setTopCarsData] = useState<TopCar[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isCarStatusOpen, setIsCarStatusOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const expiringCarsCount = 2;
  const totalCarsCount = 10;
  const solvedFines = 12;
  const totalFines = 14;

  const loadDashboardData = useCallback(async () => {
    try {
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
      showError('Không thể đồng bộ dữ liệu thống kê từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, showError]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadDashboardData(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadDashboardData]);

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  return (
    <div className="flex flex-col gap-6 select-none pb-10">
      <div className="flex justify-between items-center bg-[#1e1e2d] border border-[#2b2b40] p-6 rounded-2xl text-white">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
            <span>Chào mừng quay trở lại, đối tác quản lý!</span>
            <Sparkles className="h-5 w-5 text-amber-400 fill-current animate-pulse" />
          </h2>
          <span className="text-xs text-gray-500 font-semibold">
            Bảng điều khiển quản trị hạm đội xe datxe. Tất cả thống kê được đồng bộ theo thời gian thực.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsRatingOpen(true)}
          className="hidden md:flex items-center gap-1.5 bg-[#008F5A] hover:bg-[#007A4D] text-white px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
        >
          <span>Đánh giá dịch vụ</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <span className="h-8 w-8 rounded-full border-4 border-gray-300 border-t-[#008F5A] animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider">Đang cập nhật chỉ số...</span>
        </div>
      ) : (
        <>
          <OverviewCards today={overviewToday} thisMonth={overviewThisMonth} lastMonth={overviewLastMonth} />
          <StatusCards counts={carStatusSummary} />

          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8">
              <RevenueChart
                data={revenueChartData}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="flex-1 min-h-[150px]">
                <NotificationCarousel notices={notices} />
              </div>

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

              <div
                onClick={() => showWarning('Chi tiết phạt nguội đang đồng bộ từ Cục CSGT.')}
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
                    <span className="bg-emerald-500/10 text-[#008F5A] font-extrabold text-[9px] px-1.5 py-0.5 rounded-sm">
                      {getPercentage(solvedFines, totalFines)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-4">
              <TopServicesChart data={topServicesData} />
            </div>
            <div className="lg:col-span-8">
              <TopCarsTable cars={topCarsData} />
            </div>
          </div>
        </>
      )}

      <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} />
      <CarStatusModal isOpen={isCarStatusOpen} onClose={() => setIsCarStatusOpen(false)} />
    </div>
  );
}
