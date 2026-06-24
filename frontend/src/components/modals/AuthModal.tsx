'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, Sparkles, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onAuthenticated?: () => void;
}

type AuthResponse = {
  accessToken: string;
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
};

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthenticated }: AuthModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setIsLogin(initialMode === 'login');
    setEmail('');
    setPhone('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setPromoCode('');
    setAgreeTerms(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  }, [isOpen, initialMode]);

  if (!isOpen || typeof document === 'undefined') return null;

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Email không hợp lệ';
    }

    if (!password) {
      nextErrors.password = 'Mật khẩu không được để trống';
    } else if (!isLogin && password.length < 6) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!isLogin) {
      if (!name.trim()) nextErrors.name = 'Tên hiển thị không được để trống';
      if (phone.trim() && !/^(0|\+84)\d{9,10}$/.test(phone.trim())) {
        nextErrors.phone = 'Số điện thoại không hợp lệ';
      }
      if (password !== confirmPassword) {
        nextErrors.confirmPassword = 'Mật khẩu nhập lại không trùng khớp';
      }
      if (!agreeTerms) {
        nextErrors.agreeTerms = 'Bạn cần đồng ý với chính sách của datxe';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const finishLogin = (res: AuthResponse) => {
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    onAuthenticated?.();
    toast.success('Đăng nhập thành công!');
    onClose();

    if (res.user?.role === 'ADMIN' || res.user?.role === 'STAFF') {
      router.push('/dashboard');
    } else if (res.user?.role === 'OWNER') {
      router.push('/owner');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      if (isLogin) {
        const res = await api.auth.login({ email: email.trim(), password });
        finishLogin(res);
      } else {
        await api.auth.register({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
        const res = await api.auth.login({ email: email.trim(), password });
        finishLogin(res);
        toast.success(promoCode.trim() ? 'Đã áp dụng mã giới thiệu và tạo tài khoản.' : 'Tạo tài khoản thành công.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'Facebook' | 'Google') => {
    setLoading(true);
    setErrors({});
    try {
      const mockEmail = `${provider.toLowerCase()}_user@datxe.vn`;
      const mockName = `${provider} User`;
      const res = provider === 'Google'
        ? await api.auth.googleLogin(mockEmail, mockName)
        : await api.auth.facebookLogin(mockEmail, mockName);
      finishLogin(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Lỗi đăng nhập qua ${provider}`;
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin((value) => !value);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white text-slate-900 w-full max-w-[480px] rounded-2xl shadow-2xl p-8 z-10 overflow-y-auto max-h-[90vh] border border-emerald-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-center text-slate-950 mb-2">
          {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
        </h2>
        <p className="text-center text-sm text-slate-500 mb-6">
          {isLogin ? 'Tiếp tục đặt xe và quản lý chuyến đi của bạn.' : 'Tạo tài khoản datxe để đặt xe nhanh hơn.'}
        </p>

        {errors.form && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tên hiển thị *</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  disabled={loading}
                  className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#008F5A]`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@datxe.vn"
                disabled={loading}
                className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#008F5A]`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  disabled={loading}
                  className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#008F5A]`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Mật khẩu *</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => toast.warning('Tính năng đặt lại mật khẩu sẽ được bổ sung ở bản tiếp theo.')}
                  className="text-xs font-semibold text-[#008F5A] hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                className={`w-full bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-[#008F5A]`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Ẩn hiện mật khẩu">
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nhập lại mật khẩu *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    disabled={loading}
                    className={`w-full bg-slate-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'} rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-[#008F5A]`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Ẩn hiện mật khẩu nhập lại">
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mã giới thiệu</label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Nhập mã nếu có"
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#008F5A]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    disabled={loading}
                    className="mt-0.5 rounded border-slate-300 accent-[#008F5A]"
                  />
                  <span>
                    Tôi đã đọc và đồng ý với <span className="text-[#008F5A] font-bold">Chính sách & Quy định</span> và <span className="text-[#008F5A] font-bold">Chính sách bảo vệ dữ liệu cá nhân</span> của datxe.
                  </span>
                </label>
                {errors.agreeTerms && <p className="text-red-500 text-xs mt-1 font-medium">{errors.agreeTerms}</p>}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008F5A] hover:bg-[#007A4D] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 mt-2 shadow-sm"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</span>
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase font-medium">Hoặc tiếp tục bằng</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => handleSocialLogin('Facebook')} disabled={loading} className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50">
            Facebook
          </button>
          <button type="button" onClick={() => handleSocialLogin('Google')} disabled={loading} className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50">
            Google
          </button>
        </div>

        <div className="text-center text-xs text-slate-600 mt-6 border-t border-slate-100 pt-4">
          {isLogin ? 'Bạn chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button type="button" onClick={switchMode} className="text-[#008F5A] font-bold hover:underline cursor-pointer">
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
