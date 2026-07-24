"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  Wrench,
  X,
} from "lucide-react";
import {
  api,
  type Vehicle,
  type VehicleBusyPeriod,
  type VehicleCalendar,
} from "@/lib/api";

type Props = {
  vehicle: Pick<Vehicle, "id" | "brand" | "model" | "status">;
  initialStartDate?: string;
  initialEndDate?: string;
  onApply?: (startDate: string, endDate: string) => void;
  onClose: () => void;
};

const toDateKey = (value?: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
};

const fromDateKey = (value: string) => new Date(`${value}T00:00:00`);

const formatPeriod = (period: VehicleBusyPeriod) =>
  `${new Date(period.startDate).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  })} → ${new Date(period.endDate).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  })}`;

function periodForDay(periods: VehicleBusyPeriod[], day: Date) {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = addDays(startOfDay(day), 1).getTime();
  return periods.find(
    (period) =>
      new Date(period.startDate).getTime() < dayEnd &&
      new Date(period.endDate).getTime() > dayStart,
  );
}

function MonthGrid({
  month,
  periods,
  rangeStart,
  rangeEnd,
  onSelect,
}: {
  month: Date;
  periods: VehicleBusyPeriod[];
  rangeStart: string;
  rangeEnd: string;
  onSelect: (date: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const leading = (getDay(days[0]) + 6) % 7;
  const today = startOfDay(new Date());
  const start = rangeStart ? fromDateKey(rangeStart) : null;
  const end = rangeEnd ? fromDateKey(rangeEnd) : null;

  return (
    <section aria-label={`Lịch ${format(month, "MM/yyyy")}`}>
      <h3 className="mb-3 text-center text-sm font-black capitalize text-content">
        {format(month, "MMMM yyyy", { locale: vi })}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
          <span
            key={label}
            className="py-1 text-xs font-bold text-content-secondary"
          >
            {label}
          </span>
        ))}
        {Array.from({ length: leading }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const period = periodForDay(periods, day);
          const past = isBefore(day, today);
          const selected =
            (start && key === rangeStart) || (end && key === rangeEnd);
          const insideRange = Boolean(start && end && day > start && day < end);
          const disabled = past || Boolean(period);
          const stateLabel = period
            ? period.type === "MAINTENANCE"
              ? "bảo dưỡng"
              : "đã có lịch thuê"
            : "còn trống";

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              aria-label={`${format(day, "dd/MM/yyyy")}, ${stateLabel}`}
              aria-pressed={selected || insideRange}
              className={`relative flex min-h-11 items-center justify-center rounded-lg text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                selected
                  ? "bg-brand text-on-brand"
                  : insideRange
                    ? "bg-utility text-utility-foreground"
                    : period?.type === "MAINTENANCE"
                      ? "bg-danger-muted text-danger opacity-80"
                      : period
                        ? "bg-warning-muted text-warning opacity-80"
                        : past
                          ? "text-content-secondary opacity-35"
                          : "bg-app-surface text-content hover:bg-utility hover:text-utility-foreground"
              }`}
            >
              {format(day, "d")}
              {period && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    period.type === "MAINTENANCE"
                      ? "bg-danger"
                      : "bg-warning"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function VehicleAvailabilityDialog({
  vehicle,
  initialStartDate,
  initialEndDate,
  onApply,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [calendar, setCalendar] = useState<VehicleCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [rangeStart, setRangeStart] = useState(() =>
    toDateKey(initialStartDate),
  );
  const [rangeEnd, setRangeEnd] = useState(() => toDateKey(initialEndDate));
  const [openedAt] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = addMonths(from, 7);
      setCalendar(
        await api.vehicles.getCalendar(
          vehicle.id,
          from.toISOString(),
          to.toISOString(),
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải lịch xe.",
      );
    } finally {
      setLoading(false);
    }
  }, [vehicle.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
  }, [onClose]);

  const upcoming = useMemo(
    () =>
      (calendar?.busyPeriods || [])
        .filter((period) => new Date(period.endDate).getTime() > openedAt)
        .slice(0, 5),
    [calendar, openedAt],
  );
  const rangeConflict = useMemo(() => {
    if (!rangeStart || !rangeEnd || !calendar) return false;
    const start = fromDateKey(rangeStart).getTime();
    const end = addDays(fromDateKey(rangeEnd), 1).getTime();
    return calendar.busyPeriods.some(
      (period) =>
        new Date(period.startDate).getTime() < end &&
        new Date(period.endDate).getTime() > start,
    );
  }, [calendar, rangeEnd, rangeStart]);

  const selectDay = (day: Date) => {
    const value = format(day, "yyyy-MM-dd");
    if (!rangeStart || rangeEnd || value < rangeStart) {
      setRangeStart(value);
      setRangeEnd("");
      return;
    }
    setRangeEnd(value);
  };

  const operational =
    calendar?.vehicle.status !== "LOCKED" &&
    calendar?.vehicle.status !== "MAINTENANCE";
  const canApply = Boolean(
    onApply &&
      operational &&
      rangeStart &&
      rangeEnd &&
      rangeEnd >= rangeStart &&
      !rangeConflict,
  );

  return (
    <div
      className="fixed inset-0 z-[110] overflow-y-auto bg-night-surface/70 p-0 sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="availability-dialog-title"
        className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-app-surface text-content shadow-2xl sm:min-h-0 sm:rounded-3xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-app-border/40 bg-app-surface px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">
              Lịch hoạt động
            </p>
            <h2
              id="availability-dialog-title"
              className="mt-1 text-xl font-black sm:text-2xl"
            >
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="mt-1 text-sm text-content-secondary">
              Chọn khoảng ngày còn trống trước khi đặt xe.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng lịch xe"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-app-border text-content-secondary transition hover:bg-app-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-utility px-3 py-1.5 text-utility-foreground">
              Trống
            </span>
            <span className="rounded-full bg-warning-muted px-3 py-1.5 text-warning">
              Đã có lịch thuê
            </span>
            <span className="rounded-full bg-danger-muted px-3 py-1.5 text-danger">
              Bảo dưỡng
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-content-secondary">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang kiểm tra lịch xe…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger-muted p-5 text-danger">
              <p className="flex items-center gap-2 font-bold">
                <CircleAlert className="h-5 w-5" />
                Chưa tải được lịch xe
              </p>
              <p className="mt-2 text-sm">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 min-h-11 rounded-xl border border-danger px-4 text-sm font-bold"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {!operational && (
                <div className="mb-5 flex gap-3 rounded-2xl border border-danger/30 bg-danger-muted p-4 text-sm text-danger">
                  <Wrench className="h-5 w-5 shrink-0" />
                  <p>
                    Xe đang khóa hoặc bảo dưỡng. Bạn có thể xem lịch nhưng chưa
                    thể chọn ngày thuê.
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-app-border/40 bg-app-muted p-3 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    aria-label="Xem tháng trước"
                    onClick={() => setMonth((current) => addMonths(current, -1))}
                    disabled={
                      startOfMonth(month).getTime() <=
                      startOfMonth(new Date()).getTime()
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border bg-app-surface disabled:opacity-35"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <p className="text-sm font-bold text-content-secondary">
                    Chọn ngày nhận và ngày trả
                  </p>
                  <button
                    type="button"
                    aria-label="Xem tháng tiếp theo"
                    onClick={() => setMonth((current) => addMonths(current, 1))}
                    disabled={
                      startOfMonth(month).getTime() >=
                      addMonths(startOfMonth(new Date(openedAt)), 5).getTime()
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border bg-app-surface disabled:opacity-35"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <MonthGrid
                    month={month}
                    periods={calendar?.busyPeriods || []}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onSelect={selectDay}
                  />
                  <MonthGrid
                    month={addMonths(month, 1)}
                    periods={calendar?.busyPeriods || []}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onSelect={selectDay}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="rounded-2xl border border-app-border/40 p-4">
                  <h3 className="flex items-center gap-2 font-black">
                    <CalendarCheck2 className="h-5 w-5 text-brand" />
                    Khoảng ngày đã chọn
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-sm font-bold">
                      Ngày nhận
                      <input
                        type="date"
                        min={format(new Date(), "yyyy-MM-dd")}
                        value={rangeStart}
                        onChange={(event) => {
                          setRangeStart(event.target.value);
                          if (
                            rangeEnd &&
                            event.target.value > rangeEnd
                          ) {
                            setRangeEnd("");
                          }
                        }}
                        className="mt-1 min-h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/20"
                      />
                    </label>
                    <label className="text-sm font-bold">
                      Ngày trả
                      <input
                        type="date"
                        min={rangeStart || format(new Date(), "yyyy-MM-dd")}
                        value={rangeEnd}
                        onChange={(event) => setRangeEnd(event.target.value)}
                        className="mt-1 min-h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/20"
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-content-secondary">
                    Lịch chỉ hiển thị tình trạng, không công khai thông tin của
                    khách thuê khác. Giá và xung đột chính xác được kiểm tra lại
                    khi báo giá.
                  </p>
                  {rangeConflict && (
                    <p
                      role="alert"
                      className="mt-3 rounded-xl bg-warning-muted p-3 text-xs font-bold text-warning"
                    >
                      Khoảng ngày này giao với lịch bận. Vui lòng chọn lại các
                      ngày được đánh dấu trống.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-app-border/40 p-4">
                  <h3 className="font-black">Các khoảng bận sắp tới</h3>
                  {upcoming.length ? (
                    <ul className="mt-3 space-y-2">
                      {upcoming.map((period) => (
                        <li
                          key={`${period.type}-${period.startDate}-${period.endDate}`}
                          className="rounded-xl bg-app-muted p-3 text-sm"
                        >
                          <p
                            className={
                              period.type === "MAINTENANCE"
                                ? "font-bold text-danger"
                                : "font-bold text-warning"
                            }
                          >
                            {period.label}
                          </p>
                          <p className="mt-1 text-xs text-content-secondary">
                            {formatPeriod(period)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 rounded-xl bg-utility p-4 text-sm text-utility-foreground">
                      Chưa có lịch bận trong thời gian sắp tới.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-app-border/40 bg-app-surface p-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-app-border px-5 text-sm font-bold hover:bg-app-muted"
          >
            Đóng
          </button>
          {onApply && (
            <button
              type="button"
              disabled={!canApply}
              onClick={() => {
                if (!canApply) return;
                onApply(rangeStart, rangeEnd);
                onClose();
              }}
              className="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              Áp dụng lịch đã chọn
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
