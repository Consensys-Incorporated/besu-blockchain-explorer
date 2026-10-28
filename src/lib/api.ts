const basePath = process.env.NEXT_PUBLIC_BE_BASEPATH ?? "";

// POSTs JSON to one of our API routes and throws with the server's message on failure.
export async function postApi<T>(route: string, body: object, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${basePath}/api/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? `Request to ${route} failed (${res.status})`);
  }
  return data as T;
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object") {
    const err = e as { shortMessage?: string; reason?: string; message?: string };
    return err.shortMessage ?? err.reason ?? err.message ?? String(e);
  }
  return String(e);
}
