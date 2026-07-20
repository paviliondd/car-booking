'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

type GoogleCredentialResponse = { credential: string };

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      cancel_on_tap_outside?: boolean;
    }) => void;
    renderButton: (
      element: HTMLElement,
      options: {
        type: 'standard';
        theme: 'outline';
        size: 'large';
        text: 'continue_with';
        shape: 'rectangular';
        width: number;
        locale: 'vi';
      },
    ) => void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void | Promise<void>;
  disabled?: boolean;
}

export default function GoogleSignInButton({
  onCredential,
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  const renderGoogleButton = useCallback(() => {
    const container = containerRef.current;
    if (!clientId || !container || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => void onCredentialRef.current(credential),
      cancel_on_tap_outside: true,
    });
    container.replaceChildren();
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.min(container.clientWidth || 360, 400),
      locale: 'vi',
    });
  }, [clientId]);

  useEffect(() => {
    if (scriptReady) renderGoogleButton();
  }, [renderGoogleButton, scriptReady]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800" role="status">
        Đăng nhập Google sẽ hoạt động sau khi cấu hình Client ID.
      </p>
    );
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : undefined}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setScriptReady(false)}
      />
      <div ref={containerRef} className="min-h-11 w-full overflow-hidden" aria-label="Tiếp tục bằng Google" />
    </div>
  );
}
