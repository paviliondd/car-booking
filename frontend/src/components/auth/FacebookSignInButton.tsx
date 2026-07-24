"use client";

import Script from "next/script";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type FacebookLoginResponse = {
  status?: "connected" | "not_authorized" | "unknown";
  authResponse?: { accessToken?: string };
};

type FacebookSdk = {
  init: (options: { appId: string; cookie: boolean; xfbml: boolean }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: { scope: "public_profile"; return_scopes: true },
  ) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
  }
}

export default function FacebookSignInButton({
  onAccessToken,
  onError,
  disabled = false,
}: {
  onAccessToken: (accessToken: string) => void | Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  if (!appId) {
    return (
      <p
        className="rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-center text-sm text-warning"
        role="status"
      >
        Đăng nhập Facebook sẽ hoạt động sau khi cấu hình App ID.
      </p>
    );
  }

  const initialize = () => {
    if (!window.FB) {
      setScriptFailed(true);
      return;
    }
    window.FB.init({
      appId,
      cookie: false,
      xfbml: false,
    });
    setScriptFailed(false);
    setScriptReady(true);
  };

  const handleLogin = () => {
    if (!window.FB || !scriptReady) {
      onError("Facebook chưa tải xong. Vui lòng thử lại.");
      return;
    }
    window.FB.login(
      (response) => {
        const accessToken = response.authResponse?.accessToken;
        if (response.status === "connected" && accessToken) {
          void onAccessToken(accessToken);
          return;
        }
        onError("Bạn chưa hoàn tất đăng nhập Facebook.");
      },
      { scope: "public_profile", return_scopes: true },
    );
  };

  return (
    <>
      <Script
        src="https://connect.facebook.net/vi_VN/sdk.js"
        strategy="afterInteractive"
        onReady={initialize}
        onError={() => {
          setScriptReady(false);
          setScriptFailed(true);
        }}
      />
      <button
        type="button"
        onClick={handleLogin}
        disabled={disabled || !scriptReady || scriptFailed}
        className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-facebook px-4 text-sm font-bold text-on-facebook transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-facebook/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!scriptReady && !scriptFailed ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current"
            aria-hidden="true"
          >
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.385H7.078v-3.542h3.047V9.37c0-3.02 1.792-4.688 4.533-4.688 1.312 0 2.686.236 2.686.236v2.965H15.83c-1.491 0-1.956.93-1.956 1.884v2.306h3.328l-.532 3.542h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
          </svg>
        )}
        {scriptFailed ? "Không thể tải Facebook" : "Tiếp tục với Facebook"}
      </button>
    </>
  );
}
