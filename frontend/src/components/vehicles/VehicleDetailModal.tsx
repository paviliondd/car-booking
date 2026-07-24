"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  Car,
  ExternalLink,
  Fuel,
  Gauge,
  Palette,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { Vehicle } from "@/lib/api";
import { rentalPolicies } from "@/lib/store";
import {
  vehicleFuelLabel,
  vehicleTransmissionLabel,
} from "@/lib/vehicle-labels";
import VehicleAvailabilityDialog from "./VehicleAvailabilityDialog";

const tabs = ["Đặc điểm", "Giấy tờ thuê xe"] as const;
type Tab = (typeof tabs)[number];

const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

export default function VehicleDetailModal({
  vehicle,
  dates,
  onClose,
}: {
  vehicle: Vehicle;
  dates: { startDate?: string; endDate?: string };
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Đặc điểm");
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(
    dates.startDate || "",
  );
  const [selectedEndDate, setSelectedEndDate] = useState(dates.endDate || "");
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
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

  const booking = new URLSearchParams({ vehicleId: vehicle.id });
  if (selectedStartDate) {
    booking.set(
      "startDate",
      selectedStartDate.includes("T")
        ? selectedStartDate
        : `${selectedStartDate}T08:00:00+07:00`,
    );
  }
  if (selectedEndDate) {
    booking.set(
      "endDate",
      selectedEndDate.includes("T")
        ? selectedEndDate
        : `${selectedEndDate}T18:00:00+07:00`,
    );
  }

  const details = [
    { label: "Số chỗ", value: `${vehicle.seats} chỗ`, icon: Users },
    {
      label: "Hộp số",
      value: vehicleTransmissionLabel(vehicle.transmission),
      icon: Settings2,
    },
    {
      label: "Nhiên liệu",
      value: vehicleFuelLabel(vehicle.fuel),
      icon: Fuel,
    },
    { label: "Năm sản xuất", value: String(vehicle.year), icon: CalendarDays },
    {
      label: "Màu xe",
      value: vehicle.color || "Chưa cập nhật",
      icon: Palette,
    },
    { label: "Biển số", value: vehicle.plateNumber, icon: Car },
  ];

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-night-surface/70 p-0 sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-modal-title"
        className="mx-auto min-h-dvh max-w-6xl overflow-hidden bg-app-surface shadow-2xl sm:min-h-0 sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-app-border/40 bg-app-surface px-4 py-3 sm:px-6">
          <div
            role="tablist"
            aria-label="Thông tin xe"
            className="flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain"
          >
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-bold ${
                  tab === item
                    ? "bg-utility text-utility-foreground"
                    : "text-content-secondary hover:bg-app-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              aria-label="Mở trang chi tiết đầy đủ"
              href={`/vehicles/${vehicle.id}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-app-border text-content hover:bg-app-muted"
            >
              <ExternalLink className="h-5 w-5" />
            </Link>
            <button
              ref={closeRef}
              type="button"
              aria-label="Đóng thông tin xe"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-app-border text-content hover:bg-app-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-app-muted">
                {vehicle.images[0] ? (
                  <Image
                    src={vehicle.images[0]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    fill
                    className="object-cover"
                    sizes="700px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Car className="h-20 w-20 text-content-secondary" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                {vehicle.images.slice(1, 3).map((src, index) => (
                  <div
                    key={src}
                    className="relative aspect-video overflow-hidden rounded-2xl bg-app-muted"
                  >
                    <Image
                      src={src}
                      alt={`Ảnh ${index + 2} của ${vehicle.brand} ${vehicle.model}`}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-brand">
                  Xe tự lái
                </p>
                <h2
                  id="vehicle-modal-title"
                  className="mt-1 text-3xl font-black"
                >
                  {vehicle.brand} {vehicle.model}
                </h2>
              </div>
              <span className="rounded-full bg-utility px-3 py-1 text-sm font-bold text-utility-foreground">
                {vehicle.status === "AVAILABLE"
                  ? "Đang sẵn sàng"
                  : "Cần kiểm tra lịch"}
              </span>
            </div>

            <div
              role="tabpanel"
              className="mt-5 rounded-2xl bg-app-muted p-5 text-sm text-content-secondary"
            >
              {tab === "Đặc điểm" && (
                <div>
                  <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {details.map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-app-border/40 bg-app-surface p-3"
                      >
                        <dt className="flex items-center gap-2 text-xs font-semibold text-content-secondary">
                          <Icon className="h-4 w-4 text-brand" />
                          {label}
                        </dt>
                        <dd className="mt-1 font-bold text-content">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {vehicle.terms && (
                    <div className="mt-4 rounded-xl border border-warning/30 bg-warning-muted p-4">
                      <p className="font-bold text-warning">
                        Lưu ý riêng của xe
                      </p>
                      <p className="mt-1 whitespace-pre-line leading-6 text-warning">
                        {vehicle.terms}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {tab === "Giấy tờ thuê xe" && (
                <div className="space-y-3">
                  {rentalPolicies.map((policy) => (
                    <div
                      key={policy.title}
                      className="rounded-xl border border-app-border/40 bg-app-surface p-4"
                    >
                      <p className="font-bold text-content">{policy.title}</p>
                      <p className="mt-1 leading-6">{policy.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-app-border p-5 lg:sticky lg:top-20">
            <div className="flex gap-3 rounded-xl bg-utility p-4 text-sm text-utility-foreground">
              <ShieldCheck className="h-6 w-6 shrink-0 text-brand" />
              <p>
                <strong>Bảo hiểm thuê xe</strong>
                <br />
                Quyền lợi được trình bày trong báo giá trước khi xác nhận.
              </p>
            </div>

            <p className="mt-6 text-sm text-content-secondary">Giá từ</p>
            <p className="text-2xl font-black text-rental-price">
              {money(vehicle.dailyPrice)}
              <span className="text-sm font-semibold text-content-secondary">
                /ngày
              </span>
            </p>

            <dl className="mt-5 space-y-3 border-y border-app-border/40 py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Ngày thường</dt>
                <dd className="font-bold">{money(vehicle.dailyPrice)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Cuối tuần</dt>
                <dd className="font-bold">{money(vehicle.weekendPrice)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Ngày lễ</dt>
                <dd className="font-bold">{money(vehicle.holidayPrice)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="flex items-center gap-1 text-content-secondary">
                  <Gauge className="h-4 w-4" />
                  Giới hạn
                </dt>
                <dd className="font-bold">
                  {vehicle.limitKmPerDay
                    ? `${vehicle.limitKmPerDay} km/ngày`
                    : "Liên hệ"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Phí vượt giới hạn</dt>
                <dd className="font-bold">
                  {vehicle.overLimitFee
                    ? `${money(vehicle.overLimitFee)}/km`
                    : "Liên hệ"}
                </dd>
              </div>
            </dl>

            <Link
              href={`/booking?${booking}`}
              className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-brand font-bold text-on-brand hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
            >
              Chọn lịch thuê xe
            </Link>
            <button
              type="button"
              onClick={() => setAvailabilityOpen(true)}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-brand px-4 text-sm font-bold text-brand transition hover:bg-utility focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              <CalendarRange className="h-5 w-5" />
              Xem lịch trống của xe
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-content-secondary">
              Bạn chưa bị tính phí ở bước này.
            </p>
          </aside>
        </div>
      </section>
      {availabilityOpen && (
        <VehicleAvailabilityDialog
          vehicle={vehicle}
          initialStartDate={selectedStartDate}
          initialEndDate={selectedEndDate}
          onApply={(startDate, endDate) => {
            setSelectedStartDate(startDate);
            setSelectedEndDate(endDate);
          }}
          onClose={() => setAvailabilityOpen(false)}
        />
      )}
    </div>
  );
}
