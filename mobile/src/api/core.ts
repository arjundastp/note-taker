// Transport with a single silent refresh-and-retry. Pure and injectable so it
// is testable without Expo native modules.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Thrown when the refresh token is gone or rejected; the UI routes to login. */
export class SessionExpired extends Error {}

export interface ApiDeps {
  baseUrl: string;
  getAccess: () => string | null;
  setAccess: (t: string | null) => void;
  getRefresh: () => Promise<string | null>;
  setRefresh: (t: string | null) => Promise<void>;
  onLogout: () => void;
  fetchFn: typeof fetch;
}

export function createApi(deps: ApiDeps) {
  let refreshing: Promise<boolean> | null = null;

  async function refresh(): Promise<boolean> {
    const token = await deps.getRefresh();
    if (!token) return false;
    const res = await deps.fetchFn(`${deps.baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    deps.setAccess(data.accessToken);
    await deps.setRefresh(data.refreshToken);
    return true;
  }

  async function request(
    path: string,
    opts: RequestInit = {},
    retried = false,
  ): Promise<Response> {
    const headers = new Headers(opts.headers);
    const access = deps.getAccess();
    if (access) headers.set("Authorization", `Bearer ${access}`);

    const res = await deps.fetchFn(`${deps.baseUrl}${path}`, { ...opts, headers });

    if (res.status === 401 && !retried) {
      const body = await res.clone().json().catch(() => ({}) as { code?: string });
      if (body.code === "TOKEN_EXPIRED" || body.code === "NO_TOKEN") {
        // Dedupe concurrent 401s onto one refresh.
        refreshing ??= refresh().finally(() => {
          refreshing = null;
        });
        const ok = await refreshing;
        if (ok) return request(path, opts, true);
        deps.setAccess(null);
        await deps.setRefresh(null);
        deps.onLogout();
        throw new SessionExpired();
      }
    }
    return res;
  }

  async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await request(path, opts);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as Record<string, unknown>);
      throw new ApiError(
        res.status,
        (body.error as string) ?? "Request failed",
        body.code as string | undefined,
        body.fields as Record<string, string> | undefined,
      );
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return { api, request, refresh };
}
