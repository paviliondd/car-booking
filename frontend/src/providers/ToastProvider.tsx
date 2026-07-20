'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const warning = useCallback((message: string) => addToast('warning', message), [addToast]);
  const value = useMemo(() => ({ success, error, warning }), [success, error, warning]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Floating toast stack */}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-slide-in-right transition-all duration-300 ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/20 text-emerald-300'
                : t.type === 'error'
                ? 'bg-red-950/90 border-red-500/20 text-red-300'
                : 'bg-amber-950/90 border-amber-500/20 text-amber-300'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />}
            
            <div className="flex-grow text-sm font-medium">{t.message}</div>
            
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="-m-2 flex min-h-11 min-w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
