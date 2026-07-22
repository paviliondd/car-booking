'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard';
import OverviewCards from '@/components/dashboard/OverviewCards';
import StatusCards from '@/components/dashboard/StatusCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import NotificationCarousel from '@/components/dashboard/NotificationCarousel';
import TopServicesChart from '@/components/dashboard/TopServicesChart';
import TopCarsTable from '@/components/dashboard/TopCarsTable';
import { useToast } from '@/providers/ToastProvider';
import { AdminError } from '@/components/dashboard/AdminState';

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
  const { error: showError } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [overviewToday, setOverviewToday] = useState<Overview | null>(null);
  const [overviewThisMonth, setOverviewThisMonth] = useState<Overview | null>(null);
  const [overviewLastMonth, setOverviewLastMonth] = useState<Overview | null>(null);
  const [carStatusSummary, setCarStatusSummary] = useState<CarStatusSummary | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<RevenuePoint[]>([]);
  const [topServicesData, setTopServicesData] = useState<TopService[]>([]);
  const [topCarsData, setTopCarsData] = useState<TopCar[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');


  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
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
      const message = 'Không thể đồng bộ dữ liệu thống kê từ máy chủ.';
      setLoadError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, showError]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadDashboardData(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadDashboardData]);

  return (
    <div className="flex flex-col gap-6 pb-10">
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
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <span className="h-8 w-8 rounded-full border-4 border-gray-300 border-t-[#008F5A] animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider">Đang cập nhật chỉ số...</span>
        </div>
      ) : loadError ? <AdminError message={loadError} onRetry={() => void loadDashboardData()} /> : (
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

            <div className="lg:col-span-4">
              <div className="flex-1 min-h-[150px]">
                <NotificationCarousel notices={notices} />
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

    </div>
  );
}
