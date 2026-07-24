"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarRange,
  Car,
  CircleAlert,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import {
  api,
  type AdminBookingResponse,
  type BookingQuote,
  type QuickBookingRequest,
  type Vehicle,
} from "@/lib/api";
import VehicleAvailabilityDialog from "@/components/vehicles/VehicleAvailabilityDialog";

type Props = {
  source?: QuickBookingRequest | null;
  onClose: () => void;
  onCreated: (response: AdminBookingResponse) => void;
};

const fieldClassName =
  "mt-1 min-h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-base text-content outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-app-muted";

const toVietnamInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

const toApiDateTime = (value: string) =>
  value ? `${value}:00+07:00` : "";

const datePart = (value: string) => value.split("T")[0] || "";
const timePart = (value: string, fallback: string) =>
  value.split("T")[1] || fallback;

export default function AdminCreateBookingDialog({
  source,
  onClose,
  onCreated,
}: Props) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(source?.phone || "");
  const [vehicleId, setVehicleId] = useState(source?.vehicleId || "");
  const [startDate, setStartDate] = useState(() =>
    toVietnamInput(source?.startDate),
  );
  const [endDate, setEndDate] = useState(() =>
    toVietnamInput(source?.endDate),
  );
  const [paymentMethod, setPaymentMethod] =
    useState<"MOMO" | "BANK_TRANSFER" | "CASH">("CASH");
  const [insuranceType, setInsuranceType] =
    useState<"NONE" | "BASIC" | "PREMIUM">("NONE");
  const [depositPercent, setDepositPercent] = useState<30 | 50>(30);
  const [notes, setNotes] = useState(source?.adminNotes || "");
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteKey, setQuoteKey] = useState("");
  const [quoteErrorKey, setQuoteErrorKey] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === vehicleId) || null,
    [vehicleId, vehicles],
  );
  const quoteInputValid = Boolean(
    vehicleId && startDate && endDate && startDate < endDate,
  );
  const quoteRequestKey = [
    vehicleId,
    startDate,
    endDate,
    insuranceType,
    depositPercent,
  ].join("|");
  const activeQuote =
    quoteInputValid && quoteKey === quoteRequestKey ? quote : null;
  const activeQuoteError =
    quoteInputValid && quoteErrorKey === quoteRequestKey ? quoteError : "";
  const activeQuoteLoading = quoteInputValid && quoteLoading;

  useEffect(() => {
    let active = true;
    api.vehicles
      .findAll()
      .then((items) => {
        if (!active) return;
        setVehicles(items);
        setVehiclesLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSubmitError("Không thể tải danh sách xe.");
        setVehiclesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (availabilityOpen) return;
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [availabilityOpen, onClose]);

  useEffect(() => {
    if (!quoteInputValid) return;
    const requestKey = quoteRequestKey;
    let active = true;
    const timer = window.setTimeout(() => {
      setQuoteLoading(true);
      setQuoteError("");
      setQuoteErrorKey("");
      api.bookings
        .quote({
          vehicleId,
          startDate: toApiDateTime(startDate),
          endDate: toApiDateTime(endDate),
          insuranceType,
          depositPercent,
        })
        .then((value) => {
          if (!active) return;
          setQuote(value);
          setQuoteKey(requestKey);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setQuote(null);
          setQuoteKey("");
          setQuoteError(
            error instanceof Error ? error.message : "Không thể tính giá.",
          );
          setQuoteErrorKey(requestKey);
        })
        .finally(() => {
          if (active) setQuoteLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    depositPercent,
    endDate,
    insuranceType,
    quoteInputValid,
    quoteRequestKey,
    startDate,
    vehicleId,
  ]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeQuote) {
      setSubmitError("Vui lòng chọn lịch hợp lệ và chờ hệ thống tính giá.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await api.bookings.createAdmin({
        fullName: fullName.trim(),
        phone: phone.trim(),
        vehicleId,
        startDate: toApiDateTime(startDate),
        endDate: toApiDateTime(endDate),
        paymentMethod,
        insuranceType,
        depositPercent,
        notes: notes.trim() || undefined,
        quickBookingRequestId: source?.id,
      });
      onCreated(response);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Không thể tạo đơn thuê.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-night-surface/70 p-0 sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-create-booking-title"
        className="mx-auto min-h-dvh max-w-4xl bg-app-surface text-content shadow-2xl sm:min-h-0 sm:rounded-3xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-app-border/40 bg-app-surface px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">
              {source ? `Từ yêu cầu ${source.requestNumber}` : "Đơn thủ công"}
            </p>
            <h2
              id="admin-create-booking-title"
              className="mt-1 text-xl font-black sm:text-2xl"
            >
              Tạo đơn thuê mới
            </h2>
            <p className="mt-1 text-sm leading-5 text-content-secondary">
              Hệ thống kiểm tra lịch, tính giá và lưu thanh toán chưa thu.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng form tạo đơn"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-app-border text-content-secondary hover:bg-app-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={submit} className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            {source && (
              <div className="rounded-2xl bg-utility p-4 text-sm text-utility-foreground">
                Xe và lịch đã được điền từ yêu cầu nhanh. Bạn vẫn có thể điều
                chỉnh theo nội dung đã xác nhận với khách.
              </div>
            )}

            <fieldset className="grid gap-4 rounded-2xl border border-app-border/40 p-4 sm:grid-cols-2">
              <legend className="px-2 text-sm font-black">
                Thông tin khách hàng
              </legend>
              <label className="text-sm font-bold">
                Họ và tên
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={fieldClassName}
                />
              </label>
              <label className="text-sm font-bold">
                Số điện thoại
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="09xxxxxxxx"
                  className={fieldClassName}
                />
              </label>
            </fieldset>

            <fieldset className="space-y-4 rounded-2xl border border-app-border/40 p-4">
              <legend className="px-2 text-sm font-black">
                Xe và thời gian thuê
              </legend>
              <label className="block text-sm font-bold">
                Xe cho thuê
                <select
                  required
                  disabled={vehiclesLoading}
                  value={vehicleId}
                  onChange={(event) => setVehicleId(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="">
                    {vehiclesLoading ? "Đang tải danh sách xe…" : "Chọn xe"}
                  </option>
                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                      disabled={
                        vehicle.status === "LOCKED" ||
                        vehicle.status === "MAINTENANCE"
                      }
                    >
                      {vehicle.brand} {vehicle.model} · {vehicle.plateNumber}
                      {vehicle.status === "LOCKED" ||
                      vehicle.status === "MAINTENANCE"
                        ? " · Không khả dụng"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Nhận xe
                  <input
                    required
                    type="datetime-local"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      if (endDate && endDate <= event.target.value) {
                        setEndDate("");
                      }
                    }}
                    className={fieldClassName}
                  />
                </label>
                <label className="text-sm font-bold">
                  Trả xe
                  <input
                    required
                    type="datetime-local"
                    min={startDate}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className={fieldClassName}
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={!selectedVehicle}
                onClick={() => setAvailabilityOpen(true)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand px-4 text-sm font-bold text-brand hover:bg-utility disabled:cursor-not-allowed disabled:opacity-45"
              >
                <CalendarRange className="h-4 w-4" />
                Xem lịch trống/bận của xe
              </button>
            </fieldset>

            <fieldset className="grid gap-4 rounded-2xl border border-app-border/40 p-4 sm:grid-cols-2">
              <legend className="px-2 text-sm font-black">
                Thanh toán và ghi chú
              </legend>
              <label className="text-sm font-bold">
                Phương thức
                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value as
                        | "MOMO"
                        | "BANK_TRANSFER"
                        | "CASH",
                    )
                  }
                  className={fieldClassName}
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="MOMO">MoMo</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Mức cọc
                <select
                  value={depositPercent}
                  onChange={(event) =>
                    setDepositPercent(Number(event.target.value) as 30 | 50)
                  }
                  className={fieldClassName}
                >
                  <option value={30}>30%</option>
                  <option value={50}>50%</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Bảo hiểm
                <select
                  value={insuranceType}
                  onChange={(event) =>
                    setInsuranceType(
                      event.target.value as "NONE" | "BASIC" | "PREMIUM",
                    )
                  }
                  className={fieldClassName}
                >
                  <option value="NONE">Không chọn</option>
                  <option value="BASIC">Cơ bản</option>
                  <option value="PREMIUM">Nâng cao</option>
                </select>
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Ghi chú nội bộ
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={`${fieldClassName} py-3`}
                />
              </label>
            </fieldset>
          </div>

          <aside className="h-fit rounded-2xl border border-app-border/40 bg-app-muted p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-utility text-brand">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-content-secondary">
                  Báo giá hệ thống
                </p>
                <p className="font-black">
                  {selectedVehicle
                    ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                    : "Chưa chọn xe"}
                </p>
              </div>
            </div>

            {activeQuoteLoading ? (
              <p className="mt-5 flex items-center gap-2 text-sm text-content-secondary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang kiểm tra lịch và tính giá…
              </p>
            ) : activeQuote ? (
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-content-secondary">Số ngày</dt>
                  <dd className="font-bold">{activeQuote.totalDays}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-content-secondary">Giá thuê</dt>
                  <dd className="font-bold">
                    {activeQuote.basePrice.toLocaleString("vi-VN")} đ
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-content-secondary">Bảo hiểm</dt>
                  <dd className="font-bold">
                    {activeQuote.insuranceFee.toLocaleString("vi-VN")} đ
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-app-border/40 pt-3 text-base">
                  <dt className="font-black">Tổng tiền</dt>
                  <dd className="font-black text-rental-price">
                    {activeQuote.totalPrice.toLocaleString("vi-VN")} đ
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-content-secondary">Cần thu cọc</dt>
                  <dd className="font-black text-rental-price">
                    {activeQuote.depositAmount.toLocaleString("vi-VN")} đ
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-5 text-sm leading-6 text-content-secondary">
                Chọn xe và thời gian để nhận báo giá chính xác.
              </p>
            )}

            {(activeQuoteError || submitError) && (
              <div
                role="alert"
                className="mt-5 flex gap-2 rounded-xl bg-danger-muted p-3 text-sm text-danger"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{submitError || activeQuoteError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || activeQuoteLoading || !activeQuote}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 font-bold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {submitting ? "Đang tạo đơn…" : "Tạo đơn thuê"}
            </button>
          </aside>
        </form>
      </section>

      {availabilityOpen && selectedVehicle && (
        <VehicleAvailabilityDialog
          vehicle={selectedVehicle}
          initialStartDate={datePart(startDate)}
          initialEndDate={datePart(endDate)}
          onApply={(nextStart, nextEnd) => {
            setStartDate(
              `${nextStart}T${timePart(startDate, "08:00")}`,
            );
            setEndDate(`${nextEnd}T${timePart(endDate, "18:00")}`);
          }}
          onClose={() => setAvailabilityOpen(false)}
        />
      )}
    </div>
  );
}
