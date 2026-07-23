"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Car, ExternalLink, MapPin, ShieldCheck, X } from "lucide-react";
import type { Vehicle } from "@/lib/api";
import { rentalPolicies, storeInfo } from "@/lib/store";

export default function VehicleDetailModal({
  vehicle,
  dates,
  onClose,
}: {
  vehicle: Vehicle;
  dates: { startDate?: string; endDate?: string };
  onClose: () => void;
}) {
  const [tab, setTab] = useState("Đặc điểm");
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);
  const booking = new URLSearchParams({ vehicleId: vehicle.id });
  if (dates.startDate) booking.set("startDate", dates.startDate);
  if (dates.endDate) booking.set("endDate", dates.endDate);
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 p-3 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-modal-title"
        className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {["Đặc điểm", "Giấy tờ thuê xe", "Vị trí xe", "Chủ xe"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`min-h-11 whitespace-nowrap rounded-lg px-3 text-sm font-bold ${tab === item ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <div className="flex gap-2">
            <Link
              aria-label="Mở trang chi tiết"
              href={`/vehicles/${vehicle.id}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border"
            >
              <ExternalLink className="h-5 w-5" />
            </Link>
            <button
              ref={closeRef}
              aria-label="Đóng chi tiết xe"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                {vehicle.images[0] ? (
                  <Image
                    src={vehicle.images[0]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    fill
                    className="object-cover"
                    sizes="700px"
                  />
                ) : (
                  <Car className="m-auto h-full w-20 text-slate-300" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                {vehicle.images.slice(1, 3).map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-video overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={src}
                      alt={`Ảnh xe ${i + 2}`}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                  </div>
                ))}
              </div>
            </div>
            <h2 id="vehicle-modal-title" className="mt-6 text-3xl font-black">
              {vehicle.brand} {vehicle.model}
            </h2>
            <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              {tab === "Đặc điểm" && (
                <p>
                  {vehicle.seats} chỗ ·{" "}
                  {vehicle.transmission === "AUTO" ? "Số tự động" : "Số sàn"} ·{" "}
                  {vehicle.fuel} · Đời {vehicle.year}
                </p>
              )}
              {tab === "Giấy tờ thuê xe" &&
                rentalPolicies.map((p) => (
                  <p key={p.title}>
                    <strong>{p.title}:</strong> {p.description}
                  </p>
                ))}
              {tab === "Vị trí xe" && (
                <p className="flex gap-2">
                  <MapPin className="h-5 w-5 text-emerald-700" />
                  {storeInfo.address}
                </p>
              )}
              {tab === "Chủ xe" && (
                <p>
                  {vehicle.owner?.name
                    ? `Chủ xe: ${vehicle.owner.name}`
                    : "Xe do đội ngũ datxe trực tiếp quản lý."}
                </p>
              )}
            </div>
          </div>
          <aside className="h-fit rounded-2xl border p-5">
            <div className="flex gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950">
              <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-700" />
              <p>
                <strong>Bảo hiểm thuê xe</strong>
                <br />
                Quyền lợi được xác nhận trong báo giá.
              </p>
            </div>
            <p className="mt-6 text-sm text-slate-600">Giá từ</p>
            <p className="text-2xl font-black text-emerald-800">
              {vehicle.dailyPrice.toLocaleString("vi-VN")} đ/ngày
            </p>
            <Link
              href={`/booking?${booking}`}
              className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 font-bold text-white hover:bg-emerald-800"
            >
              Thuê xe ngay
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
