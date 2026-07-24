"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

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
        type: "standard";
        theme: "outline";
        size: "large";
        text: "continue_with";
        shape: "rectangular";
        width: number;
        locale: "vi";
      },
    ) => void;
    disableAutoSelect?: () => void;
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
  const [scriptFailed, setScriptFailed] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  const renderGoogleButton = useCallback(() => {
    const container = containerRef.current;
    if (!clientId || !container || !window.google) return;
    const availableWidth = Math.floor(container.getBoundingClientRect().width);
    if (availableWidth < 1) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => void onCredentialRef.current(credential),
      cancel_on_tap_outside: true,
    });
    container.replaceChildren();
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: Math.min(Math.max(availableWidth, 200), 400),
      locale: "vi",
    });
  }, [clientId]);

  useEffect(() => {
    if (!scriptReady || !containerRef.current) return;
    renderGoogleButton();
    const observer = new ResizeObserver(renderGoogleButton);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [renderGoogleButton, scriptReady]);

  if (!clientId) {
    return (
      <p
        className="rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-center text-sm text-warning"
        role="status"
      >
        Đăng nhập Google sẽ hoạt động sau khi cấu hình Client ID.
      </p>
    );
  }

  if (scriptFailed) {
    return (
      <p
        className="rounded-xl border border-danger/30 bg-danger-muted px-4 py-3 text-center text-sm text-danger"
        role="status"
      >
        Không thể tải đăng nhập Google. Vui lòng thử lại.
      </p>
    );
  }

  return (
    <div
      className={`w-full ${disabled ? "pointer-events-none opacity-50" : ""}`}
      aria-disabled={disabled}
    >
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => {
          setScriptFailed(false);
          setScriptReady(true);
        }}
        onError={() => {
          setScriptReady(false);
          setScriptFailed(true);
        }}
      />
      <div
        ref={containerRef}
        className="flex min-h-11 w-full justify-center overflow-hidden"
        aria-label="Tiếp tục bằng Google"
      />
    </div>
  );
}
