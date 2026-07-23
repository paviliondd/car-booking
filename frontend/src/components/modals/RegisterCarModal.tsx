"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Car,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { api, type AccountProfile } from "@/lib/api";
import { storeInfo } from "@/lib/store";

const applicationLabels: Record<string, string> = {
  PENDING_REVIEW: "Hồ sơ đang chờ thẩm định",
  CONTACTING: "datxe đang liên hệ xác minh",
  NEED_MORE_INFO: "Hồ sơ cần bổ sung thông tin",
  APPROVED: "Hồ sơ đã được phê duyệt",
  REJECTED: "Hồ sơ chưa được phê duyệt",
  CANCELLED: "Hồ sơ đã huỷ",
};

export default function RegisterCarModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [carName, setCarName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await api.account.profile();
      setProfile(next);
      setPhone(next.phone || "");
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể tải thông tin tài khoản.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadProfile]);

  if (!mounted || !isOpen) return null;

  const requestPhoneCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.auth.requestPhoneLinkCode(phone.trim());
      setCodeSent(true);
      setSuccess("Mã xác minh đã được gửi đến số điện thoại của bạn.");
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Không thể gửi mã xác minh.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await api.auth.verifyPhoneLinkCode({
        phone: phone.trim(),
        code,
      });
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("datxe-auth"));
      await loadProfile();
      setSuccess("Số điện thoại đã được xác minh.");
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Không thể xác minh số điện thoại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const application = await api.auth.createOwnerApplication({
        carName: carName.trim(),
        plateNumber: plateNumber.trim() || undefined,
        vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
        applicantNotes: notes.trim() || undefined,
      });
      setProfile((current) =>
        current ? { ...current, ownerApplication: application } : current,
      );
      setSuccess(
        `Đã nhận hồ sơ ${application.applicationNumber}. datxe sẽ phản hồi trong một ngày làm việc.`,
      );
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Không thể gửi hồ sơ.",
      );
    } finally {
      setLoading(false);
    }
  };

  const hasVerifiedPhone = Boolean(
    profile?.phone && profile.phoneVerifiedAt,
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Đăng ký xe cho thuê"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute inset-0 cursor-default bg-night-surface/65 backdrop-blur-sm"
      />
      <div className="relative z-10 max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-content-secondary hover:bg-app-muted"
          aria-label="Đóng cửa sổ"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-10">
          <p className="text-sm font-bold text-brand">Đăng ký xe</p>
          <h2 className="mt-1 text-2xl font-black">Trở thành chủ xe datxe</h2>
          <p className="mt-2 text-sm leading-6 text-content-secondary">
            Tài khoản, số điện thoại và hồ sơ xe được liên kết trực tiếp để
            tránh nhập trùng hoặc thất lạc dữ liệu.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-danger/30 bg-danger-muted p-4 text-sm font-medium text-danger"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mt-5 flex items-start gap-2 rounded-xl border border-brand/30 bg-utility p-4 text-sm font-medium text-brand"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        {loading && !profile ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          </div>
        ) : profile?.role === "OWNER" && profile.isVerifiedOwner ? (
          <div className="mt-6 rounded-2xl bg-utility p-6">
            <ShieldCheck className="h-10 w-10 text-brand" />
            <h3 className="mt-4 text-xl font-black">Bạn đã là chủ xe</h3>
            <p className="mt-2 text-sm text-content-secondary">
              Mở khu vực quản lý để thêm xe và theo dõi hoạt động cho thuê.
            </p>
            <Link
              href="/owner"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 font-bold text-on-brand"
            >
              Quản lý xe cho thuê
            </Link>
          </div>
        ) : profile?.ownerApplication &&
          !["REJECTED", "CANCELLED"].includes(
            profile.ownerApplication.status,
          ) ? (
          <div className="mt-6 rounded-2xl border border-app-border bg-app-muted p-6">
            <p className="text-sm font-bold text-brand">
              {applicationLabels[profile.ownerApplication.status] ||
                profile.ownerApplication.status}
            </p>
            <h3 className="mt-2 text-xl font-black">
              {profile.ownerApplication.applicationNumber}
            </h3>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-content-secondary">Xe đăng ký</dt>
                <dd className="font-bold">{profile.ownerApplication.carName}</dd>
              </div>
              <div>
                <dt className="text-content-secondary">Biển số</dt>
                <dd className="font-bold">
                  {profile.ownerApplication.plateNumber || "Chưa cung cấp"}
                </dd>
              </div>
            </dl>
            {(profile.ownerApplication.adminNotes ||
              profile.ownerApplication.rejectionReason) && (
              <p className="mt-4 rounded-xl bg-app-surface p-4 text-sm leading-6">
                {profile.ownerApplication.rejectionReason ||
                  profile.ownerApplication.adminNotes}
              </p>
            )}
          </div>
        ) : !hasVerifiedPhone ? (
          <form
            onSubmit={codeSent ? verifyPhone : requestPhoneCode}
            className="mt-6 grid gap-4"
          >
            <div className="rounded-xl border border-warning/30 bg-warning-muted p-4 text-sm leading-6 text-warning">
              Tài khoản Google cần liên kết và xác minh số điện thoại trước khi
              đăng ký xe.
            </div>
            <label className="text-sm font-semibold">
              Số điện thoại
              <span className="relative mt-2 block">
                <Phone className="absolute left-3 top-3.5 h-4 w-4" />
                <input
                  type="tel"
                  required
                  disabled={loading || codeSent}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0901234567"
                  className="min-h-11 w-full rounded-xl border border-app-border py-2.5 pl-10 pr-4 text-base outline-none focus:border-brand disabled:bg-app-muted"
                />
              </span>
            </label>
            {codeSent && (
              <label className="text-sm font-semibold">
                Mã xác minh 6 số
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, ""))
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-app-border px-4 text-center text-xl font-black tracking-[0.3em] outline-none focus:border-brand"
                />
              </label>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-on-brand disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {codeSent ? "Xác minh số điện thoại" : "Gửi mã xác minh"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitApplication} className="mt-6 grid gap-4">
            {profile?.ownerApplication?.status === "REJECTED" && (
              <div className="rounded-xl border border-danger/30 bg-danger-muted p-4 text-sm leading-6 text-danger">
                Hồ sơ trước chưa được phê duyệt:{" "}
                {profile.ownerApplication.rejectionReason ||
                  "chưa đáp ứng điều kiện xét duyệt"}. Bạn có thể điều chỉnh
                thông tin xe và gửi hồ sơ mới.
              </div>
            )}
            <div className="grid gap-3 rounded-xl border border-brand/25 bg-utility p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-content-secondary">
                  Người đăng ký
                </p>
                <p className="mt-1 font-bold">{profile?.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-content-secondary">
                  Số điện thoại đã xác minh
                </p>
                <p className="mt-1 font-bold text-brand">{profile?.phone}</p>
              </div>
            </div>
            <div className="flex min-h-11 items-center gap-3 rounded-xl border border-app-border bg-app-muted px-4 text-sm font-semibold">
              <MapPin className="h-5 w-5 text-brand" />
              {storeInfo.serviceArea}
            </div>
            <label className="text-sm font-semibold">
              Tên xe/dòng xe
              <span className="relative mt-2 block">
                <Car className="absolute left-3 top-3.5 h-4 w-4" />
                <input
                  required
                  value={carName}
                  onChange={(event) => setCarName(event.target.value)}
                  placeholder="Ví dụ: Toyota Vios"
                  className="min-h-11 w-full rounded-xl border border-app-border py-2.5 pl-10 pr-4 text-base outline-none focus:border-brand"
                />
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Biển số xe
                <input
                  value={plateNumber}
                  onChange={(event) => setPlateNumber(event.target.value)}
                  placeholder="86A-123.45"
                  className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 uppercase outline-none focus:border-brand"
                />
              </label>
              <label className="text-sm font-semibold">
                Năm sản xuất
                <input
                  type="number"
                  min={1980}
                  max={2100}
                  value={vehicleYear}
                  onChange={(event) => setVehicleYear(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-app-border px-4 outline-none focus:border-brand"
                />
              </label>
            </div>
            <label className="text-sm font-semibold">
              Thông tin thêm
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Tình trạng xe hoặc thời gian thuận tiện để liên hệ"
                className="mt-2 w-full rounded-xl border border-app-border px-4 py-3 outline-none focus:border-brand"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-on-brand transition hover:bg-brand-hover disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi hồ sơ thẩm định
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
