'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type AuthResponse } from '@/lib/api';
import { Car, CheckCircle2, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const storeSession = (res: AuthResponse) => {
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));

    if (res.user?.role === 'ADMIN' || res.user?.role === 'STAFF') {
      router.push('/dashboard');
    } else if (res.user?.role === 'OWNER') {
      router.push('/owner');
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      if (isLogin) {
        const res = await api.auth.login({ email: email.trim(), password });
        storeSession(res);
      } else {
        await api.auth.register({ email: email.trim(), password, name: name.trim() });
        const res = await api.auth.login({ email: email.trim(), password });
        setIsSuccess(true);
        storeSession(res);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    setLoading(true);
    setMessage('');
    setIsSuccess(false);
    try {
      const res = await api.auth.googleLogin(credential);
      storeSession(res);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Không thể đăng nhập qua Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-app-muted px-4 py-10 text-content sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-app-border/35 bg-app-surface shadow-xl lg:grid-cols-[1.05fr_1fr]">
        <section className="hidden bg-night-surface p-12 text-night-content lg:flex lg:flex-col lg:justify-between" aria-label="Lợi ích của datxe">
          <div>
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-on-brand">
              <Car className="h-7 w-7" />
            </div>
            <h2 className="max-w-sm text-4xl font-bold leading-tight">Mỗi hành trình bắt đầu bằng một chiếc xe phù hợp.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-content-secondary">Đặt xe minh bạch, quản lý lịch trình tập trung và luôn biết rõ chi phí trước khi xác nhận.</p>
          </div>
          <ul className="space-y-4 text-sm text-night-secondary">
            {['Xe và chủ xe được kiểm duyệt', 'Hợp đồng điện tử rõ ràng', 'Hỗ trợ trong suốt hành trình'].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-brand" />{benefit}</li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-6 p-6 sm:p-10 lg:p-12">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-utility p-3 text-brand lg:hidden">
            <Car className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-content">
            {isLogin ? 'Chào mừng quay trở lại!' : 'Tạo tài khoản mới'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-content-secondary">
            {isLogin ? 'Đăng nhập để đặt xe và theo dõi hành trình của bạn' : 'Trở thành thành viên datxe ngay hôm nay'}
          </p>
        </div>

        {message && (
          <div role={isSuccess ? 'status' : 'alert'} className={`rounded-xl border p-3 text-sm ${isSuccess ? 'border-brand/30 bg-utility text-brand' : 'border-danger/30 bg-danger-muted text-danger'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-sm font-semibold text-content-secondary">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-content-secondary" />
                <input
                  type="text"
                  id="auth-name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-base text-content outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-content-secondary">Địa chỉ email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-content-secondary" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@datxe.vn"
                className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-base text-content outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-content-secondary">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-content-secondary" />
              <input
                id="auth-password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-base text-content outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-on-brand transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</span>
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-app-border/35" />
          <span className="mx-4 flex-shrink text-xs font-medium uppercase text-content-secondary">Hoặc</span>
          <div className="flex-grow border-t border-app-border/35" />
        </div>

        <GoogleSignInButton onCredential={handleGoogleLogin} disabled={loading} />

        <div className="mt-2 text-center text-sm text-content-secondary">
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="min-h-11 cursor-pointer px-2 font-bold text-brand hover:underline">
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
          </button>
        </div>
        <p className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-content-secondary"><ShieldCheck className="h-4 w-4" />Thông tin đăng nhập được bảo vệ và không chia sẻ với chủ xe.</p>
        </section>
      </div>
    </main>
  );
}
