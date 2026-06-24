'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroBanner from '@/components/owner/HeroBanner';
import StepsSection from '@/components/owner/StepsSection';
import CTASection from '@/components/owner/CTASection';
import RegisterCarModal from '@/components/modals/RegisterCarModal';
import { ChevronLeft, Home } from 'lucide-react';

export default function BecomeOwnerPage() {
  const router = useRouter();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleOpenRegister = () => {
    setIsRegisterOpen(true);
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#080b11] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#080b11]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
          <span>Về trang chủ</span>
        </button>

        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Home className="h-5 w-5 text-[#00B14F]" />
          <span>Trở Thành Chủ Xe</span>
        </h1>
      </header>

      {/* Hero Banner */}
      <HeroBanner onRegisterClick={handleOpenRegister} />

      {/* 3 steps */}
      <StepsSection />

      {/* CTA Section */}
      <CTASection onRegisterClick={handleOpenRegister} />

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#05080c] py-10 px-6 md:px-12 text-center text-gray-500 text-xs mt-12">
        <p>© 2026 DATXE Platform. Cho thuê xe tự lái hiệu quả, nhanh chóng và an toàn.</p>
      </footer>

      {/* Popup Modal */}
      <RegisterCarModal isOpen={isRegisterOpen} onClose={handleCloseRegister} />
    </div>
  );
}
