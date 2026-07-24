"use client";

import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  Phone,
  X,
  Zap,
} from "lucide-react";
import {
  api,
  type AuthUser,
  type QuickBookingPublicResponse,
  type Vehicle,
} from "@/lib/api";

const browserSubscribe = () => () => undefined;

function localDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function toPickupIso(date: string) {
  return `${date}T08:00:00+07:00`;
}

function toReturnIso(date: string) {
  return `${date}T18:00:00+07:00`;
}

function readStoredPhone() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    return (JSON.parse(raw) as AuthUser).phone || "";
  } catch {
    return "";
  }
}

export default function QuickBookingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(
    browserSubscribe,
    () => true,
    () => false,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [startDate, setStartDate] = useState(() => localDate(1));
  const [endDate, setEndDate] = useState(() => localDate(2));
  const [phone, setPhone] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuickBookingPublicResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    const phoneTimer = window.setTimeout(
      () => setPhone((current) => current || readStoredPhone()),
      0,
    );
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(phoneTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !startDate || !endDate || endDate < startDate) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoadingVehicles(true);
      setError("");
      try {
        const available = await api.vehicles.search(
          toPickupIso(startDate),
          toReturnIso(endDate),
        );
        if (!active) return;
        setVehicles(available);
        setVehicleId((current) =>
          available.some((vehicle) => vehicle.id === current)
            ? current
            : available[0]?.id || "",
        );
      } catch (loadError) {
        if (!active) return;
        setVehicles([]);
        setVehicleId("");
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể kiểm tra lịch xe lúc này.",
        );
      } finally {
        if (active) setLoadingVehicles(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [endDate, open, startDate]);

  const handleStartChange = (value: string) => {
    setStartDate(value);
    if (endDate < value) setEndDate(value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!vehicleId) {
      setError("Vui lòng chọn một xe đang trống.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.quickBookings.create({
        phone,
        vehicleId,
        startDate: toPickupIso(startDate),
        endDate: toReturnIso(endDate),
      });
      setResult(response);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể gửi yêu cầu. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-overlay/65 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-booking-title"
        className="max-h-[calc(100dvh-16px)] w-full overflow-y-auto rounded-t-2xl border border-app-border bg-app-surface shadow-2xl sm:max-w-xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-app-border/50 bg-app-surface px-5 py-4 sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand">
              <Zap className="h-4 w-4" />
              Không cần tạo tài khoản
            </p>
            <h2 id="quick-booking-title" className="mt-1 text-2xl font-black">
              Đặt xe nhanh
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-app-border text-content-secondary transition hover:bg-app-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
            aria-label="Đóng đặt xe nhanh"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          <div className="px-5 py-8 text-center sm:px-8">
            <CheckCircle2 className="mx-auto h-14 w-14 text-brand" />
            <h3 className="mt-4 text-2xl font-black">Đã tiếp nhận yêu cầu</h3>
            <p className="mt-2 text-sm leading-6 text-content-secondary">
              {result.message}
            </p>
            <div className="mt-6 rounded-xl border border-brand/25 bg-utility p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-content-secondary">
                Mã yêu cầu
              </p>
              <p className="mt-1 text-xl font-black text-brand">
                {result.requestNumber}
              </p>
              <p className="mt-3 text-sm text-content-secondary">
                Số nhận liên hệ: <strong>{result.maskedPhone}</strong>
              </p>
              <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-content">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {result.smsSent
                  ? "SMS xác nhận tiếp nhận đã được gửi."
                  : "SMS chưa gửi được; yêu cầu vẫn có trong hệ thống admin."}
              </p>
            </div>
            <p className="mt-4 text-xs leading-5 text-content-secondary">
              Đây chưa phải xác nhận giữ xe. Nhân viên sẽ gọi lại để chốt lịch và
              hoàn tất đơn thuê.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="min-h-12 rounded-lg border border-app-border px-5 font-bold hover:bg-app-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
              >
                Gửi yêu cầu khác
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 rounded-lg bg-brand px-5 font-bold text-on-brand hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-5 py-6 sm:px-6">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold">
                <CalendarDays className="h-4 w-4 text-brand" />
                Ngày thuê xe
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-content-secondary">
                  Ngày nhận
                  <input
                    type="date"
                    required
                    min={localDate(1)}
                    max={localDate(365)}
                    value={startDate}
                    onChange={(event) => handleStartChange(event.target.value)}
                    className="mt-1 min-h-12 w-full rounded-lg border border-app-border bg-app-surface px-3 text-sm text-content outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                  />
                </label>
                <label className="text-xs font-semibold text-content-secondary">
                  Ngày trả
                  <input
                    type="date"
                    required
                    min={startDate}
                    max={localDate(396)}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="mt-1 min-h-12 w-full rounded-lg border border-app-border bg-app-surface px-3 text-sm text-content outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-content-secondary">
                Khung giờ dự kiến 08:00–18:00; nhân viên sẽ gọi để chốt giờ cụ
                thể.
              </p>
            </div>

            <label className="block text-sm font-bold">
              <span className="mb-2 flex items-center gap-2">
                <Car className="h-4 w-4 text-brand" />
                Chọn xe đang trống
              </span>
              <select
                required
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
                disabled={loadingVehicles || vehicles.length === 0}
                className="min-h-12 w-full rounded-lg border border-app-border bg-app-surface px-3 text-sm text-content outline-none focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-app-muted"
              >
                {loadingVehicles ? (
                  <option value="">Đang kiểm tra lịch xe…</option>
                ) : vehicles.length === 0 ? (
                  <option value="">Không có xe trống trong lịch này</option>
                ) : (
                  vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ·{" "}
                      {vehicle.dailyPrice.toLocaleString("vi-VN")} đ/ngày
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block text-sm font-bold">
              <span className="mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand" />
                Số điện thoại nhận xác nhận
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                pattern="(0|\+84|84)[0-9]{9}"
                placeholder="Ví dụ: 0901234567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-app-border bg-app-surface px-4 text-sm text-content outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || loadingVehicles || !vehicleId}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 font-bold text-on-brand transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Đang gửi yêu cầu…
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Gửi yêu cầu đặt xe nhanh
                </>
              )}
            </button>
            <p className="text-center text-xs leading-5 text-content-secondary">
              Gửi yêu cầu không tự động giữ xe hoặc thu phí. Admin sẽ nhận thông
              tin và liên hệ lại để xác nhận.
            </p>
          </form>
        )}
      </section>
    </div>,
    document.body,
  );
}
