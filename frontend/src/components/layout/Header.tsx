'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Car, Menu, X } from 'lucide-react';
import AuthModal from '../modals/AuthModal';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E0E0E0] py-4 px-6 md:px-12 flex justify-between items-center text-gray-800">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-wider text-[#00B14F]">
        <Car className="h-8 w-8 text-[#00B14F]" />
        <span>DAT<span className="text-gray-900">XE</span></span>
      </Link>

      {/* Right Nav Group (Desktop) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
        <a 
          href="https://www.mioto.vn/aboutus" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:underline hover:text-[#00B14F] transition"
        >
          Về Mioto
        </a>
        <a 
          href="https://www.mioto.vn/owner/register" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:underline hover:text-[#00B14F] transition"
        >
          Trở thành chủ xe
        </a>
        
        {/* Divider */}
        <div className="h-5 border-r border-[#E0E0E0]" />

        <button 
          onClick={() => openAuth('register')}
          className="hover:text-[#00B14F] transition font-semibold cursor-pointer"
        >
          Đăng ký
        </button>

        <button 
          onClick={() => openAuth('login')}
          className="border border-[#333] hover:border-[#00B14F] hover:text-[#00B14F] hover:bg-gray-50 transition px-4 py-2 rounded-lg font-semibold cursor-pointer"
        >
          Đăng nhập
        </button>
      </nav>

      {/* Mobile hamburger trigger */}
      <button 
        type="button"
        className="md:hidden text-gray-600 hover:text-gray-900" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[69px] right-0 bottom-0 w-64 z-40 bg-white border-l border-[#E0E0E0] p-6 flex flex-col gap-6 shadow-2xl animate-fade-in">
          <a 
            href="https://www.mioto.vn/aboutus" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-base text-gray-700 hover:text-[#00B14F] font-medium"
          >
            Về Mioto
          </a>
          <a 
            href="https://www.mioto.vn/owner/register" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-base text-gray-700 hover:text-[#00B14F] font-medium"
          >
            Trở thành chủ xe
          </a>
          <hr className="border-gray-200" />
          <button 
            type="button"
            onClick={() => openAuth('register')}
            className="text-left text-base text-gray-700 hover:text-[#00B14F] font-semibold cursor-pointer"
          >
            Đăng ký
          </button>
          <button 
            type="button"
            onClick={() => openAuth('login')}
            className="w-full text-center border border-[#333] hover:border-[#00B14F] hover:text-[#00B14F] hover:bg-gray-50 py-2.5 rounded-lg font-semibold transition cursor-pointer"
          >
            Đăng nhập
          </button>
        </div>
      )}

      {/* Embedded AuthModal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
}
