"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Car, FileText, MapPin } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api, type Booking } from "@/lib/api";
const labels: Record<string, string> = {
  PENDING: "Chờ cọc",
  CONFIRMED: "Đã xác nhận",
  RENTING: "Đang thuê",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
};
export default function AccountPage() {
  const [items, setItems] = useState<Booking[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [period, setPeriod] = useState("ALL");
  useEffect(() => {
    api.account
      .bookings()
      .then(setItems)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Không thể tải đơn thuê"),
      )
      .finally(() => setLoading(false));
  }, []);
  const current = items.filter(
    (x) => !["COMPLETED", "CANCELLED"].includes(x.status),
  );
  const history = useMemo(
    () =>
      items
        .filter((x) => ["COMPLETED", "CANCELLED"].includes(x.status))
        .filter(
          (x) =>
            period === "ALL" ||
            (x.startDate && new Date(x.startDate).getFullYear() === +period),
        ),
    [items, period],
  );
  const card = (b: Booking) => (
    <article
      key={b.id}
      className="grid gap-4 rounded-2xl border bg-app-surface p-4 sm:grid-cols-[160px_1fr]"
    >
      {b.vehicle?.images[0] ? (
        <div className="relative aspect-video overflow-hidden rounded-xl">
          <Image
            src={b.vehicle.images[0]}
            alt={b.vehicle.model}
            fill
            className="object-cover"
            sizes="160px"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl bg-app-muted">
          <Car />
        </div>
      )}
      <div>
        <div className="flex justify-between gap-3">
          <h3 className="font-black">
            {b.vehicle?.brand} {b.vehicle?.model} · {b.vehicle?.plateNumber}
          </h3>
          <span className="h-fit rounded-full bg-utility px-2 py-1 text-xs font-bold text-brand">
            {labels[b.status] || b.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-content-secondary">
          <CalendarDays className="mr-2 inline h-4 w-4" />
          {b.startDate && new Date(b.startDate).toLocaleString("vi-VN")} →{" "}
          {b.endDate && new Date(b.endDate).toLocaleString("vi-VN")}
        </p>
        <p className="mt-1 text-sm text-content-secondary">
          <MapPin className="mr-2 inline h-4 w-4" />
          {b.pickupLocation}
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          {b.contract ? (
            b.contract.pdfUrl ? (
              <a
                className="font-bold text-brand underline"
                href={b.contract.pdfUrl}
              >
                Xem hợp đồng
              </a>
            ) : (
              <Link
                className="font-bold text-brand underline"
                href={`/contract/${b.id}`}
              >
                {b.contract.signedAt ? "Hợp đồng đã ký" : "Ký hợp đồng"}
              </Link>
            )
          ) : (
            <span className="text-content-secondary">Chưa có hợp đồng</span>
          )}
        </div>
      </div>
    </article>
  );
  return (
    <div className="min-h-screen bg-app-muted">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-black">Đơn thuê của tôi</h1>
        {loading ? (
          <div className="mt-6 h-52 animate-pulse rounded-2xl bg-app-muted" />
        ) : error ? (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-danger-muted p-4 text-danger"
          >
            {error}
          </p>
        ) : (
          <>
            <section className="mt-8">
              <h2 className="text-xl font-bold">Hiện tại và sắp tới</h2>
              <div className="mt-4 grid gap-4">
                {current.length ? (
                  current.map(card)
                ) : (
                  <p className="rounded-xl bg-app-surface p-5 text-content-secondary">
                    Không có đơn thuê đang hoạt động.
                  </p>
                )}
              </div>
            </section>
            <section className="mt-10">
              <div className="flex justify-between">
                <h2 className="text-xl font-bold">Lịch sử thuê xe</h2>
                <select
                  aria-label="Lọc năm"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="min-h-11 rounded-xl border bg-app-surface px-3"
                >
                  <option value="ALL">Tất cả</option>
                  {[2026, 2025, 2024].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 grid gap-4">
                {history.length ? (
                  history.map(card)
                ) : (
                  <p className="rounded-xl bg-app-surface p-5 text-content-secondary">
                    Chưa có lịch sử thuê xe.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
