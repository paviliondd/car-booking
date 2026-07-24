"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { api, type AdminBookingResponse, type Booking } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import AdminPageHeader from "@/components/dashboard/AdminPageHeader";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/dashboard/AdminState";
import AdminCreateBookingDialog from "@/components/dashboard/AdminCreateBookingDialog";

const labels: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  RENTING: "Đang thuê",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const nextActions: Record<
  string,
  Array<{ status: string; label: string }>
> = {
  PENDING: [
    { status: "CONFIRMED", label: "Xác nhận" },
    { status: "CANCELLED", label: "Từ chối" },
  ],
  CONFIRMED: [
    { status: "RENTING", label: "Giao xe" },
    { status: "CANCELLED", label: "Hủy đơn" },
  ],
  RENTING: [{ status: "COMPLETED", label: "Nhận xe trả" }],
};

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "COMPLETED"
      ? "bg-utility text-utility-foreground"
      : status === "CANCELLED"
        ? "bg-danger-muted text-danger"
        : status === "RENTING"
          ? "bg-info-muted text-info"
          : "bg-warning-muted text-warning";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
      {labels[status] || status}
    </span>
  );
}

function AdminBookingsContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [items, setItems] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(
    searchParams.get("status") || "ALL",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await api.bookings.findAll());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải đơn thuê.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          `${item.bookingNumber} ${item.customer?.fullName || ""} ${item.customer?.phone || ""} ${item.vehicle?.plateNumber || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "ALL" || item.status === status),
      ),
    [items, query, status],
  );

  const changeStatus = async (
    item: Booking,
    next: { status: string; label: string },
  ) => {
    if (!window.confirm(`${next.label} đơn ${item.bookingNumber}?`)) return;
    setBusy(item.id);
    try {
      const updated = await api.bookings.updateStatus(item.id, next.status);
      setItems((current) =>
        current.map((entry) =>
          entry.id === updated.id ? { ...entry, ...updated } : entry,
        ),
      );
      toast.success(`Đã ${next.label.toLowerCase()} đơn.`);
    } catch (updateError) {
      toast.error(
        updateError instanceof Error
          ? updateError.message
          : "Không thể cập nhật đơn.",
      );
    } finally {
      setBusy("");
    }
  };

  const handleCreated = (response: AdminBookingResponse) => {
    setItems((current) => [response.booking, ...current]);
    setCreateOpen(false);
    toast.success(`Đã tạo đơn ${response.booking.bookingNumber}.`);
  };

  return (
    <div>
      <AdminPageHeader
        title="Quản lý đơn thuê"
        description="Theo dõi đơn từ lúc chờ xác nhận đến khi hoàn tất và kiểm soát đúng chuỗi trạng thái."
      />

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tạo đơn mới
        </button>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-app-border/40 bg-app-surface p-4 sm:grid-cols-[1fr_220px]">
        <label className="relative">
          <span className="sr-only">Tìm đơn</span>
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-content-secondary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mã đơn, khách hàng, SĐT, biển số"
            className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface pl-10 pr-3 text-base focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
          />
        </label>
        <select
          aria-label="Lọc trạng thái đơn"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="min-h-11 rounded-xl border border-app-border bg-app-surface px-3 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/20"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <AdminError message={error} onRetry={() => void load()} />
      ) : filtered.length === 0 ? (
        <AdminEmpty message="Không có đơn thuê phù hợp." />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-app-border/40 bg-app-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.bookingNumber}</p>
                    <p className="mt-1 text-sm font-semibold">
                      {item.vehicle
                        ? `${item.vehicle.brand} ${item.vehicle.model}`
                        : "Chưa có xe"}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {item.vehicle?.plateNumber}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-4 space-y-2 rounded-xl bg-app-muted p-3 text-sm">
                  <p className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-brand" />
                    {item.customer?.fullName || "—"} ·{" "}
                    {item.customer?.phone || "—"}
                  </p>
                  <p className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>
                      {formatDateTime(item.startDate)}
                      <br />
                      đến {formatDateTime(item.endDate)}
                    </span>
                  </p>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link
                    href={`/dashboard/bookings/${item.id}`}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-app-border text-sm font-bold hover:bg-app-muted"
                  >
                    Chi tiết
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  {(nextActions[item.status] || []).map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={busy === item.id}
                      onClick={() => void changeStatus(item, action)}
                      className={`min-h-11 rounded-xl px-3 text-sm font-bold disabled:opacity-50 ${
                        action.status === "CANCELLED"
                          ? "border border-danger text-danger hover:bg-danger-muted"
                          : "bg-brand text-on-brand hover:bg-brand-hover"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-app-border/40 bg-app-surface md:block">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="bg-app-muted text-xs uppercase text-content-secondary">
                <tr>
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Xe</th>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-app-border/30">
                    <td className="p-4 font-bold">{item.bookingNumber}</td>
                    <td className="p-4">
                      <p className="font-semibold">
                        {item.customer?.fullName || "—"}
                      </p>
                      <p className="text-xs text-content-secondary">
                        {item.customer?.phone}
                      </p>
                    </td>
                    <td className="p-4">
                      {item.vehicle
                        ? `${item.vehicle.brand} ${item.vehicle.model} · ${item.vehicle.plateNumber}`
                        : "—"}
                    </td>
                    <td className="p-4 text-xs">
                      {formatDateTime(item.startDate)} →{" "}
                      {formatDateTime(item.endDate)}
                    </td>
                    <td className="p-4 font-bold">
                      {item.totalPrice.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/bookings/${item.id}`}
                          className="inline-flex min-h-11 items-center rounded-lg px-3 font-bold text-brand hover:bg-utility"
                        >
                          Chi tiết
                        </Link>
                        {(nextActions[item.status] || []).map((action) => (
                          <button
                            key={action.status}
                            type="button"
                            disabled={busy === item.id}
                            onClick={() => void changeStatus(item, action)}
                            className={`min-h-11 rounded-lg px-3 text-xs font-bold disabled:opacity-50 ${
                              action.status === "CANCELLED"
                                ? "text-danger hover:bg-danger-muted"
                                : "bg-brand text-on-brand hover:bg-brand-hover"
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {createOpen && (
        <AdminCreateBookingDialog
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminBookingsContent />
    </Suspense>
  );
}
