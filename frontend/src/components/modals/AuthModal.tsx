"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { AuthResponse } from "@/lib/api";
import AuthForm from "@/components/auth/AuthForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onAuthenticated?: (response: AuthResponse) => void;
  redirectAfterAuth?: boolean;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onAuthenticated,
  redirectAfterAuth = true,
}: AuthModalProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={initialMode === "login" ? "Đăng nhập" : "Đăng ký"}
    >
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-night-surface/60 backdrop-blur-sm"
      />
      <div className="relative z-10 max-h-[94dvh] w-full max-w-[480px] overflow-y-auto rounded-2xl border border-app-border bg-app-surface px-5 py-7 shadow-2xl sm:px-9 sm:py-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-content-secondary transition hover:bg-app-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Đóng cửa sổ"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="pt-5">
          <AuthForm
            key={initialMode}
            initialMode={initialMode}
            redirectAfterAuth={redirectAfterAuth}
            onAuthenticated={(response) => {
              onAuthenticated?.(response);
              onClose();
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
