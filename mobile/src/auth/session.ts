import { api, clearSession, refresh, setSession } from "../api/client";

export interface User {
  id: string;
  email: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const authInit = (email: string, password: string): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

export async function register(email: string, password: string): Promise<User> {
  const r = await api<AuthResponse>("/api/auth/register", authInit(email, password));
  await setSession(r.accessToken, r.refreshToken);
  return r.user;
}

export async function login(email: string, password: string): Promise<User> {
  const r = await api<AuthResponse>("/api/auth/login", authInit(email, password));
  await setSession(r.accessToken, r.refreshToken);
  return r.user;
}

export async function logout(): Promise<void> {
  await clearSession();
}

/** Launch path: use the stored refresh token to get an access token, then /me. */
export async function loadSession(): Promise<User | null> {
  const ok = await refresh();
  if (!ok) return null;
  try {
    const me = await api<{ user: User }>("/api/auth/me");
    return me.user;
  } catch {
    return null;
  }
}
