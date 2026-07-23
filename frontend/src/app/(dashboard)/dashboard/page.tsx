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
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-10">
      <div className="flex items-center justify-between rounded-2xl border border-night-border bg-night-surface p-5 text-night-content shadow-sm sm:p-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="flex items-start gap-2 text-xl font-bold text-night-content sm:items-center sm:text-2xl">
            <span>Chào mừng quay trở lại</span>
            <Sparkles className="mt-1 h-5 w-5 shrink-0 fill-current text-warning sm:mt-0" />
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-night-secondary">
            Bảng điều khiển quản trị hạm đội xe datxe. Tất cả thống kê được đồng bộ theo thời gian thực.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-content-secondary">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-app-border/40 border-t-brand" />
          <span className="text-sm font-semibold">Đang cập nhật chỉ số...</span>
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
