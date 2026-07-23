'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroBanner from '@/components/owner/HeroBanner';
import StepsSection from '@/components/owner/StepsSection';
import CTASection from '@/components/owner/CTASection';
import RegisterCarModal from '@/components/modals/RegisterCarModal';
import AuthModal from '@/components/modals/AuthModal';
import { ChevronLeft, Home } from 'lucide-react';

export default function BecomeOwnerPage() {
  const router = useRouter();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleOpenRegister = () => {
    if (localStorage.getItem('token')) {
      setIsRegisterOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
  };

  return (
    <div className="min-h-screen bg-app-surface dark:bg-app-surface text-content dark:text-content transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-app-surface/80 dark:bg-app-surface/80 backdrop-blur-md border-b border-app-border/25 dark:border-app-border/30 py-4 px-6 md:px-12 flex justify-between items-center">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-semibold text-content-secondary dark:text-content-secondary hover:text-content dark:hover:text-night-content transition cursor-pointer"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
          <span>Về trang chủ</span>
        </button>

        <h1 className="text-lg font-bold tracking-tight text-content dark:text-night-content flex items-center gap-2">
          <Home className="h-5 w-5 text-brand" />
          <span>Trở thành chủ xe</span>
        </h1>
      </header>

      {/* Hero Banner */}
      <HeroBanner onRegisterClick={handleOpenRegister} />

      {/* 3 steps */}
      <StepsSection />

      {/* CTA Section */}
      <CTASection onRegisterClick={handleOpenRegister} />

      {/* Footer */}
      <footer className="border-t border-app-border/25 dark:border-app-border/30 bg-app-muted dark:bg-app-muted py-10 px-6 md:px-12 text-center text-content-secondary text-xs mt-12">
        <p>© 2026 datxe. Cho thuê xe tự lái hiệu quả, nhanh chóng và an toàn.</p>
      </footer>

      {/* Popup Modal */}
      <RegisterCarModal isOpen={isRegisterOpen} onClose={handleCloseRegister} />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode="login"
        redirectAfterAuth={false}
        onAuthenticated={() => {
          setIsAuthOpen(false);
          setIsRegisterOpen(true);
        }}
      />
    </div>
  );
}
