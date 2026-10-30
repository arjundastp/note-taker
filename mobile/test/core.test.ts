import { describe, expect, it, vi } from "vitest";
import { createApi, SessionExpired } from "../src/api/core";

function makeDeps(fetchFn: typeof fetch) {
  let access: string | null = "expired-access";
  let refreshTok: string | null = "refresh-1";
  return {
    deps: {
      baseUrl: "http://api",
      getAccess: () => access,
      setAccess: (t: string | null) => {
        access = t;
      },
      getRefresh: async () => refreshTok,
      setRefresh: async (t: string | null) => {
        refreshTok = t;
      },
      onLogout: vi.fn(),
      fetchFn,
    },
    tokens: () => ({ access, refreshTok }),
  };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("api core", () => {
  it("refreshes once on TOKEN_EXPIRED and retries", async () => {
    const calls: string[] = [];
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/api/notes") && calls.filter((c) => c.includes("/api/notes")).length === 1)
        return json(401, { code: "TOKEN_EXPIRED", error: "expired" });
      if (url.endsWith("/api/auth/refresh"))
        return json(200, { accessToken: "new-access", refreshToken: "refresh-2" });
      if (url.endsWith("/api/notes")) return json(200, [{ id: "n1" }]);
      return json(500, {});
    }) as unknown as typeof fetch;

    const { deps, tokens } = makeDeps(fetchFn);
    const { api } = createApi(deps);

    const result = await api<Array<{ id: string }>>("/api/notes");
    expect(result).toEqual([{ id: "n1" }]);
    expect(calls.filter((c) => c.includes("/api/auth/refresh"))).toHaveLength(1);
    expect(calls.filter((c) => c.endsWith("/api/notes"))).toHaveLength(2);
    expect(tokens()).toEqual({ access: "new-access", refreshTok: "refresh-2" });
    expect(deps.onLogout).not.toHaveBeenCalled();
  });

  it("clears tokens and throws SessionExpired when refresh fails", async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url.endsWith("/api/auth/refresh")) return json(401, { error: "bad refresh" });
      return json(401, { code: "TOKEN_EXPIRED", error: "expired" });
    }) as unknown as typeof fetch;

    const { deps, tokens } = makeDeps(fetchFn);
    const { api } = createApi(deps);

    await expect(api("/api/notes")).rejects.toBeInstanceOf(SessionExpired);
    expect(deps.onLogout).toHaveBeenCalledOnce();
    expect(tokens()).toEqual({ access: null, refreshTok: null });
  });
});
