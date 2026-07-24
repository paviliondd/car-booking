"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Phone,
  RotateCcw,
  User,
} from "lucide-react";
import { api, type AuthResponse } from "@/lib/api";
import FacebookSignInButton from "./FacebookSignInButton";
import GoogleSignInButton from "./GoogleSignInButton";
import { setAuthSession } from "@/lib/auth-session";

type AuthMode = "login" | "register" | "reset";

export default function AuthForm({
  initialMode = "login",
  onAuthenticated,
  redirectAfterAuth = true,
}: {
  initialMode?: "login" | "register";
  onAuthenticated?: (response: AuthResponse) => void;
  redirectAfterAuth?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const finishLogin = (response: AuthResponse) => {
    queryClient.clear();
    setAuthSession(response.accessToken, response.user);
    onAuthenticated?.(response);
    if (!redirectAfterAuth) return;
    if (response.user.role === "ADMIN" || response.user.role === "STAFF") {
      router.replace("/dashboard");
    } else if (response.user.role === "OWNER") {
      router.replace("/owner");
    } else {
      router.replace("/account");
    }
    router.refresh();
  };

  const resetFlow = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setCodeSent(false);
    setAgreeTerms(false);
    setError("");
    setNotice("");
  };

  const validatePassword = () => {
    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setError("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.");
      return false;
    }
    if (mode !== "login" && password !== confirmPassword) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (mode === "login") {
        const response = await api.auth.login({
          phone: phone.trim(),
          password,
        });
        finishLogin(response);
        return;
      }

      if (!codeSent) {
        if (mode === "register") {
          if (name.trim().length < 2) {
            setError("Vui lòng nhập tên hiển thị.");
            return;
          }
          if (!validatePassword()) return;
          if (!agreeTerms) {
            setError("Bạn cần đồng ý với chính sách và quy định.");
            return;
          }
          await api.auth.requestRegistrationCode(phone.trim());
        } else {
          await api.auth.requestPasswordResetCode(phone.trim());
        }
        setCodeSent(true);
        setNotice("Mã xác minh đã được gửi và có hiệu lực trong 5 phút.");
        return;
      }

      if (!/^\d{6}$/.test(code)) {
        setError("Vui lòng nhập đúng mã xác minh gồm 6 chữ số.");
        return;
      }
      if (mode === "register") {
        const response = await api.auth.register({
          phone: phone.trim(),
          code,
          name: name.trim(),
          password,
        });
        finishLogin(response);
      } else {
        if (!validatePassword()) return;
        await api.auth.resetPassword({
          phone: phone.trim(),
          code,
          password,
        });
        resetFlow("login");
        setNotice("Đã đặt lại mật khẩu. Bạn có thể đăng nhập ngay.");
      }
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể xử lý yêu cầu. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setLoading(true);
    setError("");
    try {
      finishLogin(await api.auth.googleLogin(credential));
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể đăng nhập bằng Google.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFacebook = async (accessToken: string) => {
    setLoading(true);
    setError("");
    try {
      finishLogin(await api.auth.facebookLogin(accessToken));
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể đăng nhập bằng Facebook.",
      );
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "login"
      ? "Đăng nhập"
      : mode === "register"
        ? "Đăng ký"
        : "Đặt lại mật khẩu";

  return (
    <div className="w-full">
      <h1 className="text-center text-2xl font-black text-content">{title}</h1>
      <p className="mt-2 text-center text-sm leading-6 text-content-secondary">
        {mode === "login"
          ? "Đăng nhập để quản lý chuyến đi và xe cho thuê."
          : mode === "register"
            ? "Tạo tài khoản bằng số điện thoại đã xác minh."
            : "Xác minh số điện thoại để tạo mật khẩu mới."}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-danger/30 bg-danger-muted px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2 rounded-xl border border-brand/30 bg-utility px-4 py-3 text-sm font-medium text-brand"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "register" && (
          <label className="text-sm font-semibold text-content-secondary">
            Tên hiển thị
            <span className="relative mt-2 block">
              <User className="absolute left-3 top-3.5 h-4 w-4" />
              <input
                type="text"
                autoComplete="name"
                required
                disabled={loading || codeSent}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-app-muted"
              />
            </span>
          </label>
        )}

        <label className="text-sm font-semibold text-content-secondary">
          Số điện thoại
          <span className="relative mt-2 block">
            <Phone className="absolute left-3 top-3.5 h-4 w-4" />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              disabled={loading || codeSent}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0901234567"
              className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-app-muted"
            />
          </span>
        </label>

        {(mode === "login" || mode === "register" || codeSent) && (
          <label className="text-sm font-semibold text-content-secondary">
            {mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}
            <span className="relative mt-2 block">
              <Lock className="absolute left-3 top-3.5 h-4 w-4" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                disabled={loading || (mode === "register" && codeSent)}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface py-2.5 pl-10 pr-12 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-app-muted"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-1 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-content-secondary"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </span>
          </label>
        )}

        {mode !== "login" && (mode === "register" || codeSent) && (
          <label className="text-sm font-semibold text-content-secondary">
            Nhập lại mật khẩu
            <input
              type="password"
              autoComplete="new-password"
              required
              disabled={loading || (mode === "register" && codeSent)}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-app-border bg-app-surface px-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-app-muted"
            />
          </label>
        )}

        {codeSent && (
          <label className="text-sm font-semibold text-content-secondary">
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
              className="mt-2 min-h-12 w-full rounded-xl border border-app-border bg-app-surface px-4 text-center text-xl font-black tracking-[0.3em] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </label>
        )}

        {mode === "register" && !codeSent && (
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-content-secondary">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(event) => setAgreeTerms(event.target.checked)}
              className="mt-1 h-4 w-4 accent-brand"
            />
            <span>
              Tôi đồng ý với Chính sách &amp; Quy định và Chính sách bảo vệ dữ
              liệu cá nhân của datxe.
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 font-bold text-on-brand transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {mode === "login"
            ? "Đăng nhập"
            : !codeSent
              ? "Gửi mã xác minh"
              : mode === "register"
                ? "Xác minh và đăng ký"
                : "Đặt lại mật khẩu"}
        </button>

        {codeSent && (
          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setCode("");
              setNotice("");
            }}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 text-sm font-bold text-brand"
          >
            <RotateCcw className="h-4 w-4" />
            Đổi số điện thoại
          </button>
        )}
      </form>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => resetFlow("reset")}
          className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center text-sm font-bold text-brand hover:underline"
        >
          Quên mật khẩu?
        </button>
      )}

      {mode !== "reset" && (
        <>
          <div className="my-5 flex items-center gap-4 text-xs font-medium uppercase text-content-secondary">
            <span className="h-px flex-1 bg-app-border" />
            Hoặc
            <span className="h-px flex-1 bg-app-border" />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <GoogleSignInButton
              onCredential={handleGoogle}
              disabled={loading}
            />
            <FacebookSignInButton
              onAccessToken={handleFacebook}
              onError={setError}
              disabled={loading}
            />
          </div>
        </>
      )}

      <div className="mt-5 text-center text-sm text-content-secondary">
        {mode === "login" ? "Bạn chưa là thành viên?" : "Đã có tài khoản?"}{" "}
        <button
          type="button"
          onClick={() => resetFlow(mode === "login" ? "register" : "login")}
          className="min-h-11 cursor-pointer px-2 font-bold text-brand hover:underline"
        >
          {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
        </button>
      </div>
    </div>
  );
}
