const API_BASE = "";

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    // Only redirect to landing if the user was on a protected page.
    // If already on "/", just throw so AuthProvider can set user=null without
    // triggering a full-page reload loop.
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export default apiFetch;
