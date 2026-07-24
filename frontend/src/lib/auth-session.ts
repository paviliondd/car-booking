import type { AuthUser } from "@/lib/api";

export const AUTH_EVENT = "datxe-auth";

export function getAuthSnapshot() {
  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");
  return token && rawUser ? `${token}:${rawUser}` : "";
}

export function getAuthIdentitySnapshot() {
  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");
  if (!token || !rawUser) return "";
  try {
    const user = JSON.parse(rawUser) as Pick<AuthUser, "id">;
    return user.id ? `${token}:${user.id}` : "";
  } catch {
    return "";
  }
}

export const getServerAuthSnapshot = () => "";

export function subscribeToAuth(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("focus", onStoreChange);
  window.addEventListener(AUTH_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener(AUTH_EVENT, onStoreChange);
  };
}

export function setAuthSession(accessToken: string, user: AuthUser) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.setItem("token", accessToken);
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function updateStoredAuthUser(user: AuthUser) {
  const next = JSON.stringify(user);
  if (localStorage.getItem("user") === next) return;
  localStorage.setItem("user", next);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  const google = window.google as
    | {
        accounts?: {
          id?: { disableAutoSelect?: () => void };
        };
      }
    | undefined;
  google?.accounts?.id?.disableAutoSelect?.();
  window.dispatchEvent(new Event(AUTH_EVENT));
}
