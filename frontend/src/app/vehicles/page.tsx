"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Car,
  Fuel,
  Heart,
  MapPin,
  Search,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VehicleDetailModal from "@/components/vehicles/VehicleDetailModal";
import { api, type Vehicle } from "@/lib/api";
import { storeInfo } from "@/lib/store";

function VehiclesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [seats, setSeats] = useState("ALL"),
    [fuel, setFuel] = useState("ALL"),
    [brand, setBrand] = useState("ALL"),
    [maxPrice, setMaxPrice] = useState("");
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setVehicles(
        startDate && endDate
          ? await api.vehicles.search(startDate, endDate)
          : await api.vehicles.availableNow(),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách xe.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const brands = useMemo(
    () => [...new Set(vehicles.map((v) => v.brand))].sort(),
    [vehicles],
  );
  const filtered = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          `${v.brand} ${v.model}`.toLowerCase().includes(query.toLowerCase()) &&
          (seats === "ALL" || v.seats === +seats) &&
          (fuel === "ALL" || v.fuel === fuel) &&
          (brand === "ALL" || v.brand === brand) &&
          (!maxPrice || v.dailyPrice <= +maxPrice),
      ),
    [vehicles, query, seats, fuel, brand, maxPrice],
  );
  const modalVehicle =
    selected || vehicles.find((v) => v.id === params.get("xe")) || null;
  const open = (v: Vehicle) => {
    setSelected(v);
    const p = new URLSearchParams(params.toString());
    p.set("xe", v.id);
    router.replace(`/vehicles?${p}`, { scroll: false });
  };
  const close = () => {
    setSelected(null);
    const p = new URLSearchParams(params.toString());
    p.delete("xe");
    router.replace(`/vehicles?${p}`, { scroll: false });
  };
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <Header />
      <main className="flex-1">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-black">Xe sẵn sàng cho thuê</h1>
            {startDate && endDate && (
              <p className="mt-2 text-sm font-semibold text-emerald-800">
                Đã kiểm tra lịch {new Date(startDate).toLocaleString("vi-VN")} →{" "}
                {new Date(endDate).toLocaleString("vi-VN")}
              </p>
            )}
            <div className="mt-6 grid gap-3 rounded-2xl bg-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  aria-label="Tìm xe"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm hãng, dòng xe"
                  className="min-h-11 w-full rounded-xl border bg-white pl-10 pr-3"
                />
              </label>
              <select
                aria-label="Hãng xe"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="min-h-11 rounded-xl border bg-white px-3"
              >
                <option value="ALL">Tất cả hãng</option>
                {brands.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <select
                aria-label="Số chỗ"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="min-h-11 rounded-xl border bg-white px-3"
              >
                <option value="ALL">Tất cả số chỗ</option>
                {[4, 5, 7, 9].map((x) => (
                  <option key={x}>{x} chỗ</option>
                ))}
              </select>
              <select
                aria-label="Nhiên liệu"
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
                className="min-h-11 rounded-xl border bg-white px-3"
              >
                <option value="ALL">Tất cả nhiên liệu</option>
                <option value="GASOLINE">Xăng</option>
                <option value="DIESEL">Dầu</option>
                <option value="ELECTRIC">Điện</option>
              </select>
              <input
                aria-label="Giá tối đa"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Giá tối đa/ngày"
                className="min-h-11 rounded-xl border bg-white px-3"
              />
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((x) => (
                <div
                  key={x}
                  className="h-96 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"
            >
              <AlertTriangle className="h-5 w-5" />
              <p className="font-bold">Không thể tải dữ liệu xe</p>
              <p>{error}</p>
              <button
                onClick={() => void load()}
                className="mt-3 min-h-11 rounded-xl bg-red-700 px-4 font-bold text-white"
              >
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
              <Car className="mx-auto h-12 w-12 text-slate-500" />
              <h2 className="mt-3 text-xl font-bold">Không có xe phù hợp</h2>
              <p className="text-slate-600">
                Hãy đổi bộ lọc hoặc khung giờ thuê.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((v) => (
                <article
                  key={v.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <button
                    onClick={() => open(v)}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-video bg-slate-100">
                      {v.images[0] ? (
                        <Image
                          src={v.images[0]}
                          alt={`${v.brand} ${v.model}`}
                          fill
                          className="object-cover"
                          sizes="(min-width:1280px)25vw,50vw"
                        />
                      ) : (
                        <Car className="m-auto h-full w-12 text-slate-400" />
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-orange-700 px-2 py-1 text-xs font-bold text-white">
                        Ưu đãi chuyến đầu
                      </span>
                      <span className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/70 text-white">
                        <Heart className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                          <ShieldCheck className="mr-1 inline h-3 w-3" />
                          Miễn thế chấp
                        </span>
                        <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-900">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          Giao xe tận nơi
                        </span>
                      </div>
                      <h2 className="mt-3 text-lg font-black">
                        {v.brand} {v.model}
                      </h2>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                        <span>
                          <Settings2 className="inline h-4 w-4" />{" "}
                          {v.transmission === "AUTO" ? "Tự động" : "Số sàn"}
                        </span>
                        <span>
                          <Users className="inline h-4 w-4" /> {v.seats} chỗ
                        </span>
                        <span>
                          <Fuel className="inline h-4 w-4" /> {v.fuel}
                        </span>
                      </div>
                      <p className="mt-3 flex gap-1 text-xs font-medium text-slate-700">
                        <MapPin className="h-4 w-4 text-emerald-800" />
                        {storeInfo.address}
                      </p>
                      <div className="mt-4 border-t pt-3 text-right text-xl font-black text-emerald-800">
                        {v.dailyPrice.toLocaleString("vi-VN")} đ
                        <span className="text-xs font-semibold text-slate-600">
                          /ngày
                        </span>
                      </div>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
      {modalVehicle && (
        <VehicleDetailModal
          vehicle={modalVehicle}
          dates={{ startDate, endDate }}
          onClose={close}
        />
      )}
    </div>
  );
}
export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-slate-50" />}>
      <VehiclesContent />
    </Suspense>
  );
}
