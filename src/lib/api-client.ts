/** Small fetch wrapper for Dearly's own API routes. Errors carry the server's message and code. */
export class ApiClientError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
  get isAuth() {
    return this.status === 401;
  }
  get isEntitlement() {
    return this.status === 402 || this.code === "entitlement";
  }
  get isNotConfigured() {
    return this.status === 503 && this.code === "not_configured";
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: "same-origin",
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new ApiClientError(0, "You seem to be offline. Check your connection and try again.", "network");
  }
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new ApiClientError(res.status, (data as { error?: string }).error ?? `Request failed (${res.status}).`, (data as { code?: string }).code);
  return data as T;
}

export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
  return e instanceof Error && e.message ? e.message : fallback;
}
