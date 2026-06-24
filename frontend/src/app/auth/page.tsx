'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Car, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (isLogin) {
        const res = await api.auth.login({ email, password });
        localStorage.setItem('token', res.accessToken);
        router.push('/');
      } else {
        await api.auth.register({ email, password, name });
        setIsLogin(true);
        setErrorMsg('Đăng ký thành công! Hãy đăng nhập bằng tài khoản vừa tạo.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Facebook') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const mockEmail = `${provider.toLowerCase()}_user@gmail.com`;
      const mockName = `${provider} User`;
      const res = provider === 'Google' 
        ? await api.auth.googleLogin(mockEmail, mockName)
        : await api.auth.facebookLogin(mockEmail, mockName);
      
      localStorage.setItem('token', res.accessToken);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || `Lỗi đăng nhập qua ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[150px]"></div>

      <div className="max-w-md w-full glass-panel border border-white/5 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Car className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isLogin ? 'Chào mừng quay trở lại!' : 'Tạo tài khoản mới'}
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            {isLogin ? 'Đăng nhập để đặt xe và theo dõi hành trình của bạn' : 'Trở thành thành viên DATXE ngay hôm nay'}
          </p>
        </div>

        {errorMsg && (
          <div className={`p-3 rounded-lg text-xs border ${errorMsg.includes('thành công') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-500 text-white" 
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-medium">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-500 text-white" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-medium">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-950 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-500 text-white" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 transition"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</span>
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase">Hoặc đăng nhập bằng</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            <svg className="h-4 w-4 text-red-500 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.414 0-6.19-2.77-6.19-6.19 0-3.42 2.777-6.19 6.19-6.19 1.485 0 2.844.53 3.904 1.407l3.056-3.056C19.123 2.152 16.035 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.48 0 10.785-4.55 10.785-11.085 0-.74-.065-1.3-.195-1.885h-10.59z"/>
            </svg>
            <span>Google</span>
          </button>

          <button 
            type="button"
            onClick={() => handleSocialLogin('Facebook')}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            <svg className="h-4 w-4 text-blue-500 fill-current" viewBox="0 0 24 24">
              <path d="M23.998 12c0-6.627-5.372-12-11.999-12C5.372 0 0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.61 22.954 24 17.99 24 12z"/>
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        <div className="text-center text-xs text-gray-400 mt-2">
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} {' '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-blue-400 font-bold hover:underline cursor-pointer"
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}
