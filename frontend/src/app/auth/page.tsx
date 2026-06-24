'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Car, Loader2, Lock, Mail, User } from 'lucide-react';

type AuthResponse = {
  accessToken: string;
  user: {
    email?: string;
    name?: string;
    role?: string;
  };
};

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

  const handleSocialLogin = async (provider: 'Google' | 'Facebook') => {
    setLoading(true);
    setMessage('');
    setIsSuccess(false);
    try {
      const mockEmail = `${provider.toLowerCase()}_user@datxe.vn`;
      const mockName = `${provider} User`;
      const res = provider === 'Google'
        ? await api.auth.googleLogin(mockEmail, mockName)
        : await api.auth.facebookLogin(mockEmail, mockName);
      storeSession(res);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : `Lỗi đăng nhập qua ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setEmail('admin@datxe.vn');
    setPassword('123456');
    setIsLogin(true);
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const res = await api.auth.login({ email: 'admin@datxe.vn', password: '123456' });
      storeSession(res);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Không thể đăng nhập tài khoản quản trị demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Car className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isLogin ? 'Chào mừng quay trở lại!' : 'Tạo tài khoản mới'}
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            {isLogin ? 'Đăng nhập để đặt xe và theo dõi hành trình của bạn' : 'Trở thành thành viên datxe ngay hôm nay'}
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs border ${isSuccess ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">Địa chỉ email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@datxe.vn"
                className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008F5A] hover:bg-[#007A4D] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 transition"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</span>
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10" />
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase">Hoặc tiếp tục bằng</span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => handleSocialLogin('Google')} disabled={loading} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50">
            Google
          </button>
          <button type="button" onClick={() => handleSocialLogin('Facebook')} disabled={loading} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50">
            Facebook
          </button>
        </div>

        <button
          type="button"
          onClick={handleDemoAdminLogin}
          disabled={loading}
          className="w-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer disabled:opacity-50"
        >
          Dùng tài khoản quản trị demo
        </button>

        <div className="text-center text-xs text-slate-400 mt-2">
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 font-bold hover:underline cursor-pointer">
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}
