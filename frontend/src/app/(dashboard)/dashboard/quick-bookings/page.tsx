"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ClipboardPlus,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import AdminPageHeader from "@/components/dashboard/AdminPageHeader";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/dashboard/AdminState";
import {
  api,
  type QuickBookingRequest,
  type QuickBookingStatus,
} from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import AdminCreateBookingDialog from "@/components/dashboard/AdminCreateBookingDialog";

const statusLabels: Record<QuickBookingStatus, string> = {
  NEW: "Mới",
  CONTACTING: "Đang liên hệ",
  CONTACTED: "Đã liên hệ",
  CLOSED: "Đã xử lý hoàn tất",
  CANCELLED: "Đã hủy",
};

const statusOptions = Object.entries(statusLabels) as Array<
  [QuickBookingStatus, string]
>;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function displayPhone(value: string) {
  return value.startsWith("+84") ? `0${value.slice(3)}` : value;
}

export default function QuickBookingsAdminPage() {
  const toast = useToast();
  const [items, setItems] = useState<QuickBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<QuickBookingStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<QuickBookingRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState<QuickBookingStatus>("NEW");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [createSource, setCreateSource] =
    useState<QuickBookingRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.quickBookings.list({
        ...(status !== "ALL" ? { status } : {}),
        ...(appliedSearch ? { search: appliedSearch } : {}),
        limit: 100,
      });
      setItems(response.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải yêu cầu đặt xe nhanh.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openRequest = (item: QuickBookingRequest) => {
    setSelected(item);
    setDraftStatus(item.status);
    setNotes(item.adminNotes || "");
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
  };

  const save = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await api.quickBookings.update(selected.id, {
        status: draftStatus,
        adminNotes: notes,
      });
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelected(updated);
      toast.success("Đã cập nhật yêu cầu đặt xe nhanh.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Không thể cập nhật yêu cầu.",
      );
    } finally {
      setBusy(false);
    }
  };

  const resendSms = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await api.quickBookings.resendSms(selected.id);
      setSelected((current) =>
        current ? { ...current, smsStatus: response.smsStatus } : current,
      );
      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? { ...item, smsStatus: response.smsStatus }
            : item,
        ),
      );
      if (response.smsSent) {
        toast.success(response.message);
      } else {
        toast.warning(response.message);
      }
    } catch (sendError) {
      toast.error(
        sendError instanceof Error ? sendError.message : "Không thể gửi SMS.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Đặt xe nhanh"
        description="Tiếp nhận yêu cầu không cần tài khoản, liên hệ khách và chuyển sang quy trình đơn thuê chính thức sau khi xác nhận."
      />

      <form
        onSubmit={submitSearch}
        className="mb-5 grid gap-3 rounded-2xl border border-app-border/40 bg-app-surface p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto]"
      >
        <label className="relative">
          <span className="sr-only">Tìm yêu cầu</span>
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-content-secondary" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mã yêu cầu, SĐT, xe hoặc biển số"
            className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/20"
          />
        </label>
        <select
          aria-label="Lọc trạng thái"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as QuickBookingStatus | "ALL")
          }
          className="min-h-11 rounded-xl border border-app-border bg-app-surface px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/20"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
        >
          Tìm kiếm
        </button>
      </form>

      {selected && (
        <section className="mb-5 rounded-2xl border border-brand/35 bg-app-surface p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand">
                Đang xử lý
              </p>
              <h2 className="mt-1 text-xl font-black">
                {selected.requestNumber}
              </h2>
              <p className="mt-1 text-sm text-content-secondary">
                {selected.vehicle.brand} {selected.vehicle.model} ·{" "}
                {selected.vehicle.plateNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="flex min-h-11 min-w-11 self-end items-center justify-center rounded-xl border border-app-border text-content-secondary hover:bg-app-muted sm:self-auto"
              aria-label="Đóng phần xử lý"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
            <div className="grid gap-3 rounded-xl bg-app-muted p-4 text-sm sm:grid-cols-2">
              <a
                href={`tel:${selected.phone}`}
                className="flex min-h-11 items-center gap-2 rounded-lg px-2 font-bold text-brand hover:bg-utility"
              >
                <Phone className="h-4 w-4" />
                {displayPhone(selected.phone)}
              </a>
              <p className="flex min-h-11 items-center gap-2 px-2">
                <CalendarDays className="h-4 w-4 text-brand" />
                {formatDate(selected.startDate)} → {formatDate(selected.endDate)}
              </p>
              <p className="flex min-h-11 items-center gap-2 px-2">
                <MessageSquareText className="h-4 w-4 text-brand" />
                SMS:{" "}
                <strong>
                  {selected.smsStatus === "SENT"
                    ? "Đã gửi"
                    : selected.smsStatus === "FAILED"
                      ? "Gửi lỗi/chưa cấu hình"
                      : "Đang chờ"}
                </strong>
              </p>
              <button
                type="button"
                onClick={() => void resendSms()}
                disabled={busy}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 font-bold hover:bg-app-muted disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Gửi lại SMS
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold">
                Trạng thái xử lý
                <select
                  value={draftStatus}
                  disabled={Boolean(selected.booking)}
                  onChange={(event) =>
                    setDraftStatus(event.target.value as QuickBookingStatus)
                  }
                  className="mt-1 min-h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-app-muted"
                >
                  {statusOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                Ghi chú nội bộ
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Kết quả cuộc gọi, giờ hẹn, lưu ý của khách…"
                  className="mt-1 w-full rounded-xl border border-app-border bg-app-surface p-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/20"
                />
              </label>
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-hover disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Lưu xử lý
              </button>
              {selected.booking ? (
                <Link
                  href={`/dashboard/bookings/${selected.booking.id}`}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand px-4 text-sm font-bold text-brand hover:bg-utility"
                >
                  Mở đơn {selected.booking.bookingNumber}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreateSource(selected)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand px-4 text-sm font-bold text-brand hover:bg-utility"
                >
                  <ClipboardPlus className="h-4 w-4" />
                  Tạo đơn từ yêu cầu
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <AdminLoading label="Đang tải yêu cầu đặt xe nhanh…" />
      ) : error ? (
        <AdminError message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <AdminEmpty message="Chưa có yêu cầu đặt xe nhanh phù hợp." />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-app-border/40 bg-app-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black">{item.requestNumber}</p>
                    <p className="mt-1 text-sm text-content-secondary">
                      {item.vehicle.brand} {item.vehicle.model}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-app-muted px-2.5 py-1 text-xs font-bold">
                    {statusLabels[item.status]}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-brand" />
                    {displayPhone(item.phone)}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand" />
                    {formatDate(item.startDate)} → {formatDate(item.endDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openRequest(item)}
                  className="mt-4 min-h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-hover"
                >
                  Xử lý yêu cầu
                </button>
                {item.booking ? (
                  <Link
                    href={`/dashboard/bookings/${item.booking.id}`}
                    className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-brand px-4 text-sm font-bold text-brand hover:bg-utility"
                  >
                    Mở đơn {item.booking.bookingNumber}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreateSource(item)}
                    className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand px-4 text-sm font-bold text-brand hover:bg-utility"
                  >
                    <ClipboardPlus className="h-4 w-4" />
                    Tạo đơn
                  </button>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-app-border/40 bg-app-surface md:block">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-app-muted text-xs uppercase text-content-secondary">
                <tr>
                  <th className="p-4">Mã yêu cầu</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Xe</th>
                  <th className="p-4">Ngày thuê</th>
                  <th className="p-4">SMS</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-app-border/30">
                    <td className="p-4 font-bold">{item.requestNumber}</td>
                    <td className="p-4">
                      <a
                        href={`tel:${item.phone}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        {displayPhone(item.phone)}
                      </a>
                    </td>
                    <td className="p-4">
                      {item.vehicle.brand} {item.vehicle.model}
                      <p className="text-xs text-content-secondary">
                        {item.vehicle.plateNumber}
                      </p>
                    </td>
                    <td className="p-4 text-xs">
                      {formatDate(item.startDate)} → {formatDate(item.endDate)}
                    </td>
                    <td className="p-4">
                      {item.smsStatus === "SENT" ? "Đã gửi" : "Chưa gửi"}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-app-muted px-2.5 py-1 text-xs font-bold">
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openRequest(item)}
                          className="min-h-11 rounded-xl bg-brand px-4 text-xs font-bold text-on-brand hover:bg-brand-hover"
                        >
                          Xử lý
                        </button>
                        {item.booking ? (
                          <Link
                            href={`/dashboard/bookings/${item.booking.id}`}
                            className="inline-flex min-h-11 items-center rounded-xl border border-brand px-4 text-xs font-bold text-brand hover:bg-utility"
                          >
                            Mở đơn
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCreateSource(item)}
                            className="min-h-11 rounded-xl border border-brand px-4 text-xs font-bold text-brand hover:bg-utility"
                          >
                            Tạo đơn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {createSource && (
        <AdminCreateBookingDialog
          source={createSource}
          onClose={() => setCreateSource(null)}
          onCreated={(response) => {
            const updated = response.quickBookingRequest;
            if (updated) {
              setItems((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              );
              setSelected((current) =>
                current?.id === updated.id ? updated : current,
              );
            } else {
              void load();
            }
            setCreateSource(null);
            toast.success(
              `Đã tạo đơn ${response.booking.bookingNumber} và hoàn tất yêu cầu.`,
            );
          }}
        />
      )}
    </div>
  );
}
