'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff, Mail, Loader2, Sparkles, Phone, User, Lock } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  // Form Fields State
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
    // Reset form states on reopen/mode change
    setPhone('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setPromoCode('');
    setAgreeTerms(false);
    setErrors({});
  }, [isOpen, initialMode]);

  if (!isOpen || !mounted) return null;

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!phone.trim()) {
      tempErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^\d{10,11}$/.test(phone.trim())) {
      tempErrors.phone = 'Số điện thoại không hợp lệ (phải có 10-11 số)';
    }

    if (!isLogin) {
      if (!name.trim()) {
        tempErrors.name = 'Tên hiển thị không được để trống';
      }
      if (!password) {
        tempErrors.password = 'Mật khẩu không được để trống';
      } else if (password.length < 6) {
        tempErrors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
      }
      if (password !== confirmPassword) {
        tempErrors.confirmPassword = 'Mật khẩu nhập lại không trùng khớp';
      }
      if (!agreeTerms) {
        tempErrors.agreeTerms = 'Bạn phải đồng ý với Điều khoản & Quy định';
      }
    } else {
      if (!password) {
        tempErrors.password = 'Mật khẩu không được để trống';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Giả lập cuộc gọi API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);

    if (isLogin) {
      toast.success('Đăng nhập thành công!');
      onClose();
    } else {
      toast.success('Đăng ký tài khoản mới thành công!');
      setIsLogin(true); // Switch to login screen
    }
  };

  const handleSocialLogin = async (provider: 'Facebook' | 'Google') => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoading(false);
    toast.success(`Đăng nhập qua ${provider} thành công!`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white text-gray-900 w-full max-w-[480px] rounded-2xl shadow-2xl p-8 z-10 animate-scale-up-center overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-950 mb-6">
          {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Phone Field */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Số điện thoại *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại của bạn"
                disabled={loading}
                className={`w-full bg-gray-50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-[#00B14F]`} 
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
          </div>

          {/* Name Field (Register Only) */}
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Tên hiển thị *</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  disabled={loading}
                  className={`w-full bg-gray-50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-[#00B14F]`} 
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
            </div>
          )}

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">Mật khẩu *</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => toast.success('Link đặt lại mật khẩu đã được gửi.')}
                  className="text-xs font-semibold text-[#00B14F] hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                className={`w-full bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-lg py-2.5 pl-10 pr-10 text-sm text-gray-900 focus:outline-none focus:border-[#00B14F]`} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
          </div>

          {/* Confirm Password (Register Only) */}
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nhập lại mật khẩu *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                  className={`w-full bg-gray-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-lg py-2.5 pl-10 pr-10 text-sm text-gray-900 focus:outline-none focus:border-[#00B14F]`} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword}</p>}
            </div>
          )}

          {/* Promo Code (Register Only) */}
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Mã giới thiệu (không bắt buộc)</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Nhập mã giới thiệu (nếu có)"
                  disabled={loading}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-[#00B14F]" 
                />
              </div>
            </div>
          )}

          {/* Agree Terms Checkbox (Register Only) */}
          {!isLogin && (
            <div>
              <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 rounded border-gray-300 accent-[#00B14F]" 
                />
                <span>
                  Tôi đã đọc và đồng ý với{' '}
                  <span className="text-[#00B14F] font-bold hover:underline">Chính sách & Quy định</span>
                  {' '}và{' '}
                  <span className="text-[#00B14F] font-bold hover:underline">Chính sách bảo vệ dữ liệu cá nhân</span>
                  {' '}của Mioto.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-red-500 text-xs mt-1 font-medium">{errors.agreeTerms}</p>}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#00B14F] hover:bg-[#009b45] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 mt-2 shadow-sm"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</span>
          </button>
        </form>

        {/* Social login divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-medium">Hoặc đăng nhập bằng</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleSocialLogin('Facebook')}
            disabled={loading}
            className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <svg className="h-4.5 w-4.5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
              <path d="M23.998 12c0-6.627-5.372-12-11.999-12C5.372 0 0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.61 22.954 24 17.99 24 12z"/>
            </svg>
            <span>Facebook</span>
          </button>

          <button 
            onClick={() => handleSocialLogin('Google')}
            disabled={loading}
            className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <svg className="h-4.5 w-4.5 text-red-500 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.414 0-6.19-2.77-6.19-6.19 0-3.42 2.777-6.19 6.19-6.19 1.485 0 2.844.53 3.904 1.407l3.056-3.056C19.123 2.152 16.035 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.48 0 10.785-4.55 10.785-11.085 0-.74-.065-1.3-.195-1.885h-10.59z"/>
            </svg>
            <span>Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 mt-6 border-t border-gray-100 pt-4">
          {isLogin ? 'Bạn chưa là thành viên?' : 'Đã có tài khoản?'} {' '}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="text-[#00B14F] font-bold hover:underline cursor-pointer"
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
