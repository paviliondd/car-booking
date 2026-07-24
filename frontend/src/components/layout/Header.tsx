"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Car, LogOut, Menu, UserCircle, X } from "lucide-react";
import AuthModal from "../modals/AuthModal";
import type { AuthUser } from "@/lib/api";
import {
  clearAuthSession,
  getAuthSnapshot,
  getServerAuthSnapshot,
  subscribeToAuth,
} from "@/lib/auth-session";

const navItems = [
  { href: "/about", label: "Về datxe" },
  { href: "/become-owner", label: "Trở thành chủ xe" },
];

const browserSubscribe = () => () => undefined;

function parseStoredUser(snapshot: string): AuthUser | null {
  if (!snapshot) return null;
  try {
    return JSON.parse(snapshot.slice(snapshot.indexOf(":") + 1)) as AuthUser;
  } catch {
    return null;
  }
}

function accountHref(user: AuthUser) {
  if (user.role === "OWNER") return "/owner";
  if (user.role === "ADMIN" || user.role === "STAFF") return "/dashboard";
  return "/account";
}

export default function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const mounted = useSyncExternalStore(
    browserSubscribe,
    () => true,
    () => false,
  );
  const authSnapshot = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );
  const user = parseStoredUser(authSnapshot);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    queryClient.clear();
    clearAuthSession();
    setMobileMenuOpen(false);
    router.replace("/");
    router.refresh();
  };

  const navLinkClass =
    "inline-flex min-h-11 items-center font-medium transition hover:text-brand";

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-brand/25 bg-app-surface/95 px-4 py-3 text-content shadow-sm backdrop-blur sm:px-6 lg:px-10 xl:px-12">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-lg text-2xl font-extrabold tracking-tight text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
        >
          <Car className="h-8 w-8 text-brand" />
          <span>
            dat<span className="text-content">xe</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm text-content-secondary lg:flex xl:gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass}>
              {item.label}
            </Link>
          ))}

          <div className="h-5 border-r border-brand/25" />

          {user ? (
            <>
              <Link
                href={accountHref(user)}
                className="flex min-h-11 items-center gap-2 rounded-lg text-content-secondary transition hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
              >
                <UserCircle className="h-5 w-5" />
                <span className="max-w-32 truncate xl:max-w-40">
                  {user.name || user.email || user.phone}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-app-border px-4 font-semibold transition hover:border-brand hover:bg-utility hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
              >
                <LogOut className="h-4 w-4" />
                Thoát
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth("register")}
                className="min-h-11 cursor-pointer px-2 font-semibold transition hover:text-brand"
              >
                Đăng ký
              </button>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="min-h-11 cursor-pointer rounded-lg border border-app-border px-4 font-semibold transition hover:border-brand hover:bg-utility hover:text-brand"
              >
                Đăng nhập
              </button>
            </>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-content-secondary hover:bg-app-muted hover:text-content focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 lg:hidden"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-site-menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </header>

      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex justify-end lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-night-surface/65 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Đóng menu"
            />
            <aside
              id="mobile-site-menu"
              className="relative flex h-dvh w-[min(86vw,340px)] flex-col overflow-y-auto border-l border-brand/25 bg-app-surface p-5 shadow-2xl"
              aria-label="Menu chính"
            >
              <div className="flex items-center justify-between border-b border-app-border pb-4">
                <span className="flex items-center gap-2 text-xl font-black text-brand">
                  <Car className="h-6 w-6" />
                  dat<span className="-ml-2 text-content">xe</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-content-secondary hover:bg-app-muted"
                  aria-label="Đóng menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="mt-4 flex flex-col gap-1" aria-label="Điều hướng">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-content-secondary hover:bg-app-muted hover:text-brand"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-app-border pt-5">
                {user ? (
                  <div className="space-y-3">
                    <Link
                      href={accountHref(user)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-12 items-center gap-3 rounded-xl bg-utility px-4 font-bold text-brand"
                    >
                      <UserCircle className="h-5 w-5" />
                      Tài khoản của tôi
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-app-border font-bold text-danger hover:bg-danger-muted"
                    >
                      <LogOut className="h-5 w-5" />
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => openAuth("register")}
                      className="min-h-12 rounded-xl border border-app-border font-bold hover:bg-app-muted"
                    >
                      Đăng ký
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuth("login")}
                      className="min-h-12 rounded-xl bg-brand font-bold text-on-brand hover:bg-brand-hover"
                    >
                      Đăng nhập
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
