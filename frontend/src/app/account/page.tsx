"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  FileCheck2,
  FileText,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  api,
  type AccountProfile,
  type Booking,
  type CustomerDocumentKeys,
} from "@/lib/api";

type Section = "profile" | "trips" | "rentals" | "password";

const bookingLabels: Record<string, string> = {
  PENDING: "Chờ cọc",
  CONFIRMED: "Đã xác nhận",
  RENTING: "Đang thuê",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
};

const applicationLabels: Record<string, string> = {
  PENDING_REVIEW: "Chờ thẩm định",
  CONTACTING: "Đang liên hệ",
  NEED_MORE_INFO: "Cần bổ sung thông tin",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Không được phê duyệt",
  CANCELLED: "Đã huỷ",
};

const documentLabels: Record<keyof CustomerDocumentKeys, string> = {
  idCardFront: "Mặt trước CCCD/CMND",
  idCardBack: "Mặt sau CCCD/CMND",
  driverLicense: "Giấy phép lái xe",
};

export default function AccountPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    birthDate: "",
    gender: "",
    address: "",
    idCardNo: "",
  });
  const [documents, setDocuments] = useState<
    Partial<Record<keyof CustomerDocumentKeys, File>>
  >({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [linkPhone, setLinkPhone] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [linkCodeSent, setLinkCodeSent] = useState(false);

  const syncProfile = useCallback((next: AccountProfile) => {
    setProfile(next);
    setProfileForm({
      name: next.name,
      email: next.email || "",
      birthDate: next.birthDate?.slice(0, 10) || "",
      gender: next.gender || "",
      address: next.address || "",
      idCardNo: next.idCardNo || "",
    });
    setLinkPhone(next.phone || "");
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        localStorage.setItem(
          "user",
          JSON.stringify({ ...JSON.parse(stored), name: next.name, email: next.email }),
        );
        window.dispatchEvent(new Event("datxe-auth"));
      } catch {
        // A malformed local cache is replaced at the next login.
      }
    }
  }, []);

  const load = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      router.replace("/auth");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [nextProfile, nextBookings] = await Promise.all([
        api.account.profile(),
        api.account.bookings(),
      ]);
      syncProfile(nextProfile);
      setBookings(nextBookings);
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể tải thông tin tài khoản.",
      );
    } finally {
      setLoading(false);
    }
  }, [router, syncProfile]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => !["COMPLETED", "CANCELLED"].includes(booking.status),
      ),
    [bookings],
  );
  const pastBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ["COMPLETED", "CANCELLED"].includes(booking.status),
      ),
    [bookings],
  );

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const next = await api.account.updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim() || undefined,
        birthDate: profileForm.birthDate || undefined,
        gender:
          (profileForm.gender as AccountProfile["gender"]) || undefined,
        address: profileForm.address.trim() || undefined,
        idCardNo: profileForm.idCardNo.trim() || undefined,
      });
      syncProfile(next);
      setMessage("Thông tin cá nhân đã được lưu vào hệ thống.");
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Không thể lưu hồ sơ.",
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadDocuments = async (event: React.FormEvent) => {
    event.preventDefault();
    if (Object.keys(documents).length === 0) {
      setError("Vui lòng chọn ít nhất một tệp để tải lên.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const stored = await api.storage.uploadCustomerDocuments(documents);
      setProfile((current) =>
        current ? { ...current, documents: stored } : current,
      );
      setDocuments({});
      setMessage(
        "Tài liệu đã được lưu vào kho riêng tư và liên kết với hồ sơ của bạn.",
      );
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Không thể tải tài liệu.",
      );
    } finally {
      setUploading(false);
    }
  };

  const viewDocument = async (key: string) => {
    setError("");
    try {
      const blob = await api.storage.getPrivateDocument(key);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Không thể mở tài liệu.",
      );
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }
    setSaving(true);
    try {
      await api.account.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage("Mật khẩu đã được thay đổi.");
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Không thể đổi mật khẩu.",
      );
    } finally {
      setSaving(false);
    }
  };

  const verifyProfilePhone = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (!linkCodeSent) {
        await api.auth.requestPhoneLinkCode(linkPhone.trim());
        setLinkCodeSent(true);
        setMessage("Mã xác minh đã được gửi đến số điện thoại mới.");
      } else {
        await api.auth.verifyPhoneLinkCode({
          phone: linkPhone.trim(),
          code: linkCode,
        });
        const next = await api.account.profile();
        syncProfile(next);
        setShowPhoneVerification(false);
        setLinkCodeSent(false);
        setLinkCode("");
        setMessage("Số điện thoại đã được xác minh và lưu vào tài khoản.");
      }
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể xác minh số điện thoại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("datxe-auth"));
    router.replace("/");
  };

  const nav = [
    { id: "profile" as const, label: "Tài khoản của tôi", icon: UserRound },
    { id: "rentals" as const, label: "Quản lý xe cho thuê", icon: Car },
    { id: "trips" as const, label: "Chuyến của tôi", icon: CalendarDays },
    { id: "password" as const, label: "Đổi mật khẩu", icon: KeyRound },
  ];

  const bookingCard = (booking: Booking) => (
    <article
      key={booking.id}
      className="grid gap-4 rounded-2xl border border-app-border bg-app-surface p-4 sm:grid-cols-[150px_1fr]"
    >
      {booking.vehicle?.images[0] ? (
        <div className="relative aspect-video overflow-hidden rounded-xl">
          <Image
            src={booking.vehicle.images[0]}
            alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
            fill
            sizes="150px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex min-h-24 items-center justify-center rounded-xl bg-app-muted">
          <Car className="h-8 w-8 text-content-secondary" />
        </div>
      )}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="font-black">
            {booking.vehicle?.brand} {booking.vehicle?.model}
          </h3>
          <span className="rounded-full bg-utility px-3 py-1 text-xs font-bold text-brand">
            {bookingLabels[booking.status] || booking.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-content-secondary">
          <CalendarDays className="mr-2 inline h-4 w-4" />
          {booking.startDate &&
            new Date(booking.startDate).toLocaleString("vi-VN")}{" "}
          →{" "}
          {booking.endDate &&
            new Date(booking.endDate).toLocaleString("vi-VN")}
        </p>
        <p className="mt-1 text-sm text-content-secondary">
          <MapPin className="mr-2 inline h-4 w-4" />
          {booking.pickupLocation}
        </p>
        {booking.contract && (
          <Link
            href={`/contract/${booking.id}`}
            className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-brand hover:underline"
          >
            <FileText className="h-4 w-4" />
            {booking.contract.signedAt ? "Xem hợp đồng" : "Ký hợp đồng"}
          </Link>
        )}
      </div>
    </article>
  );

  return (
    <div className="min-h-dvh bg-app-muted text-content">
      <Header />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[260px_1fr] md:px-6 md:py-10">
        <aside className="h-fit rounded-2xl border border-app-border bg-app-surface p-3 md:sticky md:top-24">
          <div className="border-b border-app-border px-3 py-4">
            <p className="text-sm text-content-secondary">Xin chào bạn!</p>
            <p className="mt-1 truncate text-lg font-black">
              {profile?.name || "Khách hàng datxe"}
            </p>
          </div>
          <nav className="mt-3 grid gap-1" aria-label="Tài khoản">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setError("");
                    setMessage("");
                  }}
                  className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${
                    section === item.id
                      ? "bg-utility text-brand"
                      : "text-content-secondary hover:bg-app-muted hover:text-content"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex min-h-11 w-full cursor-pointer items-center gap-3 border-t border-app-border px-3 pt-3 text-sm font-bold text-danger"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </aside>

        <section className="min-w-0">
          {loading ? (
            <div className="h-80 animate-pulse rounded-2xl bg-app-surface" />
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-danger/30 bg-danger-muted p-4 text-sm font-medium text-danger"
                >
                  {error}
                </div>
              )}
              {message && (
                <div
                  role="status"
                  className="mb-4 flex items-center gap-2 rounded-xl border border-brand/30 bg-utility p-4 text-sm font-medium text-brand"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {message}
                </div>
              )}

              {section === "profile" && profile && (
                <div className="grid gap-6">
                  <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h1 className="text-2xl font-black">
                          Thông tin tài khoản
                        </h1>
                        <p className="mt-1 text-sm text-content-secondary">
                          Cập nhật một lần, sử dụng cho các chuyến thuê và hồ sơ
                          chủ xe.
                        </p>
                      </div>
                      <span className="rounded-full bg-utility px-3 py-1.5 text-xs font-bold text-brand">
                        {profile.phoneVerifiedAt
                          ? "SĐT đã xác minh"
                          : "Chưa xác minh SĐT"}
                      </span>
                    </div>
                    <form
                      onSubmit={saveProfile}
                      className="mt-6 grid gap-4 sm:grid-cols-2"
                    >
                      <label className="text-sm font-semibold">
                        Tên hiển thị
                        <input
                          required
                          value={profileForm.name}
                          onChange={(event) =>
                            setProfileForm({
                              ...profileForm,
                              name: event.target.value,
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Số điện thoại
                        <input
                          readOnly
                          value={profile.phone || "Chưa cập nhật"}
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border bg-app-muted px-4 text-base text-content-secondary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhoneVerification((value) => !value);
                            setLinkCodeSent(false);
                            setLinkCode("");
                          }}
                          className="mt-2 min-h-11 cursor-pointer text-sm font-bold text-brand hover:underline"
                        >
                          {profile.phone ? "Đổi số điện thoại" : "Thêm và xác minh số điện thoại"}
                        </button>
                      </label>
                      {showPhoneVerification && (
                        <div className="rounded-xl border border-brand/25 bg-utility p-4 sm:col-span-2">
                          <p className="font-bold">Xác minh số điện thoại</p>
                          <p className="mt-1 text-sm text-content-secondary">
                            Mã OTP sẽ được gửi đến số mới. Sau khi xác minh, số
                            này được đồng bộ với hồ sơ khách hàng.
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                            <input
                              type="tel"
                              required
                              disabled={linkCodeSent || saving}
                              value={linkPhone}
                              onChange={(event) => setLinkPhone(event.target.value)}
                              placeholder="0901234567"
                              aria-label="Số điện thoại mới"
                              className="min-h-11 rounded-xl border border-app-border bg-app-surface px-4 text-base outline-none focus:border-brand disabled:bg-app-muted"
                            />
                            {linkCodeSent && (
                              <input
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                required
                                maxLength={6}
                                value={linkCode}
                                onChange={(event) =>
                                  setLinkCode(event.target.value.replace(/\D/g, ""))
                                }
                                placeholder="Mã 6 số"
                                aria-label="Mã xác minh"
                                className="min-h-11 rounded-xl border border-app-border bg-app-surface px-4 text-center font-bold tracking-widest outline-none focus:border-brand"
                              />
                            )}
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void verifyProfilePhone()}
                              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 font-bold text-on-brand disabled:opacity-50"
                            >
                              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                              {linkCodeSent ? "Xác minh" : "Gửi mã"}
                            </button>
                          </div>
                        </div>
                      )}
                      <label className="text-sm font-semibold">
                        Email liên hệ (không bắt buộc)
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(event) =>
                            setProfileForm({
                              ...profileForm,
                              email: event.target.value,
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Ngày sinh
                        <input
                          type="date"
                          value={profileForm.birthDate}
                          onChange={(event) =>
                            setProfileForm({
                              ...profileForm,
                              birthDate: event.target.value,
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Giới tính
                        <select
                          value={profileForm.gender}
                          onChange={(event) =>
                            setProfileForm({
                              ...profileForm,
                              gender: event.target.value,
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand"
                        >
                          <option value="">Chưa chọn</option>
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold">
                        Số CCCD/CMND
                        <input
                          inputMode="numeric"
                          value={profileForm.idCardNo}
                          onChange={(event) =>
                            setProfileForm({
                              ...profileForm,
                              idCardNo: event.target.value.replace(/\D/g, ""),
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                        />
                      </label>
                      <label className="text-sm font-semibold sm:col-span-2">
                        Địa chỉ
                        <input
                          value={profileForm.address}
                          onChange={(event) =>
                            setProfileForm({
                              ...profileForm,
                              address: event.target.value,
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-on-brand transition hover:bg-brand-hover disabled:opacity-50 sm:w-fit"
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Lưu thông tin
                      </button>
                    </form>
                  </section>

                  <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-7">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-1 h-6 w-6 text-brand" />
                      <div>
                        <h2 className="text-xl font-black">
                          CCCD và giấy phép lái xe
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-content-secondary">
                          Tệp được lưu trong vùng riêng tư. Chỉ bạn và nhân sự
                          được phân quyền mới có thể xem.
                        </p>
                      </div>
                    </div>
                    <form
                      onSubmit={uploadDocuments}
                      className="mt-5 grid gap-4 lg:grid-cols-3"
                    >
                      {(
                        Object.keys(documentLabels) as Array<
                          keyof CustomerDocumentKeys
                        >
                      ).map((field) => (
                        <div
                          key={field}
                          className="rounded-xl border border-app-border bg-app-muted p-4"
                        >
                          <p className="font-bold">{documentLabels[field]}</p>
                          <p className="mt-1 text-xs text-content-secondary">
                            JPG, PNG, WebP hoặc PDF · tối đa 8 MB
                          </p>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              setDocuments((current) => {
                                const next = { ...current };
                                if (file) next[field] = file;
                                else delete next[field];
                                return next;
                              });
                            }}
                            className="mt-3 block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-utility file:px-3 file:py-2 file:font-bold file:text-brand"
                          />
                          {profile.documents[field] && (
                            <button
                              type="button"
                              onClick={() =>
                                void viewDocument(profile.documents[field]!)
                              }
                              className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-brand hover:underline"
                            >
                              <FileCheck2 className="h-4 w-4" />
                              Xem tệp đã lưu
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-on-brand transition hover:bg-brand-hover disabled:opacity-50 lg:col-span-3 lg:w-fit"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Lưu tài liệu
                      </button>
                    </form>
                  </section>
                </div>
              )}

              {section === "trips" && (
                <div>
                  <h1 className="text-3xl font-black">Chuyến của tôi</h1>
                  <section className="mt-7">
                    <h2 className="text-lg font-bold">Hiện tại và sắp tới</h2>
                    <div className="mt-4 grid gap-4">
                      {activeBookings.length ? (
                        activeBookings.map(bookingCard)
                      ) : (
                        <p className="rounded-2xl border border-app-border bg-app-surface p-6 text-content-secondary">
                          Bạn chưa có chuyến đang hoạt động.
                        </p>
                      )}
                    </div>
                  </section>
                  <section className="mt-8">
                    <h2 className="text-lg font-bold">Lịch sử chuyến</h2>
                    <div className="mt-4 grid gap-4">
                      {pastBookings.length ? (
                        pastBookings.map(bookingCard)
                      ) : (
                        <p className="rounded-2xl border border-app-border bg-app-surface p-6 text-content-secondary">
                          Chưa có lịch sử thuê xe.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {section === "rentals" && profile && (
                <div>
                  <h1 className="text-3xl font-black">Quản lý xe cho thuê</h1>
                  <section className="mt-6 rounded-2xl border border-app-border bg-app-surface p-6 sm:p-8">
                    {profile.role === "OWNER" &&
                    profile.isVerifiedOwner ? (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-utility text-brand">
                          <Car className="h-7 w-7" />
                        </div>
                        <h2 className="mt-5 text-xl font-black">
                          Tài khoản chủ xe đã được xác minh
                        </h2>
                        <p className="mt-2 max-w-xl text-content-secondary">
                          Quản lý danh sách xe, lịch cho thuê, booking và doanh
                          thu trong khu vực chủ xe.
                        </p>
                        <Link
                          href="/owner"
                          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 font-bold text-on-brand hover:bg-brand-hover"
                        >
                          Mở khu vực chủ xe
                        </Link>
                      </>
                    ) : profile.ownerApplication ? (
                      <>
                        <span className="rounded-full bg-utility px-3 py-1 text-xs font-bold text-brand">
                          {applicationLabels[
                            profile.ownerApplication.status
                          ] || profile.ownerApplication.status}
                        </span>
                        <h2 className="mt-4 text-xl font-black">
                          Hồ sơ {profile.ownerApplication.applicationNumber}
                        </h2>
                        <p className="mt-2 text-content-secondary">
                          Xe đăng ký: {profile.ownerApplication.carName}
                          {profile.ownerApplication.plateNumber
                            ? ` · ${profile.ownerApplication.plateNumber}`
                            : ""}
                        </p>
                        {profile.ownerApplication.status ===
                          "NEED_MORE_INFO" && (
                          <p className="mt-4 rounded-xl bg-warning-muted p-4 text-sm text-warning">
                            {profile.ownerApplication.adminNotes ||
                              "datxe cần bổ sung thông tin và sẽ liên hệ với bạn."}
                          </p>
                        )}
                        {profile.ownerApplication.status === "REJECTED" && (
                          <>
                            <p className="mt-4 rounded-xl bg-danger-muted p-4 text-sm text-danger">
                              {profile.ownerApplication.rejectionReason ||
                                "Hồ sơ chưa đáp ứng điều kiện xét duyệt."}
                            </p>
                            <Link
                              href="/become-owner"
                              className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-brand px-5 font-bold text-brand hover:bg-utility"
                            >
                              Điều chỉnh và gửi hồ sơ mới
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-utility text-brand">
                          <Car className="h-7 w-7" />
                        </div>
                        <h2 className="mt-5 text-xl font-black">
                          Đưa xe của bạn lên datxe
                        </h2>
                        <p className="mt-2 max-w-xl text-content-secondary">
                          Số điện thoại đã xác minh sẽ được dùng tự động. Bạn chỉ
                          cần cung cấp thông tin chiếc xe để gửi thẩm định.
                        </p>
                        <Link
                          href="/become-owner"
                          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 font-bold text-on-brand hover:bg-brand-hover"
                        >
                          Đăng ký xe cho thuê
                        </Link>
                      </>
                    )}
                  </section>
                </div>
              )}

              {section === "password" && profile && (
                <section className="max-w-2xl rounded-2xl border border-app-border bg-app-surface p-6 sm:p-8">
                  <h1 className="text-2xl font-black">Đổi mật khẩu</h1>
                  {!profile.hasPassword ? (
                    <p className="mt-4 rounded-xl bg-warning-muted p-4 text-sm leading-6 text-warning">
                      Tài khoản Google chưa có mật khẩu. Hãy xác minh số điện
                      thoại, sau đó dùng “Quên mật khẩu” ở màn hình đăng nhập để
                      tạo mật khẩu.
                    </p>
                  ) : (
                    <form
                      onSubmit={changePassword}
                      className="mt-6 grid gap-4"
                    >
                      <label className="text-sm font-semibold">
                        Mật khẩu hiện tại
                        <input
                          type="password"
                          autoComplete="current-password"
                          required
                          value={passwordForm.currentPassword}
                          onChange={(event) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: event.target.value,
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Mật khẩu mới
                        <input
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={passwordForm.newPassword}
                          onChange={(event) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: event.target.value,
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Nhập lại mật khẩu mới
                        <input
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={passwordForm.confirmPassword}
                          onChange={(event) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: event.target.value,
                            })
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 text-base outline-none focus:border-brand"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-on-brand hover:bg-brand-hover disabled:opacity-50 sm:w-fit"
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Cập nhật mật khẩu
                      </button>
                    </form>
                  )}
                </section>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
