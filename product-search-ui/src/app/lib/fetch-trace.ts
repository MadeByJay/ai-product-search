import { headers } from "next/headers";

/**
 * Use this in SERVER code (RSC/SSR/route handlers).
 * Adds a trace label and logs detailed context on failure.
 */
export async function tracedFetch(
  label: string,
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === "string" ? input : (input as URL | Request).toString();
  const method = (
    init?.method ?? (input instanceof Request ? input.method : "GET")
  ).toUpperCase();

  // Try to attach correlation info from the inbound request
  let corr: string | undefined;
  try {
    const h = await headers();
    corr = h.get("x-correlation-id") ?? undefined;
  } catch {
    /* headers() may not be available in some contexts */
  }

  try {
    const res = await fetch(input, init);
    if (!res.ok) {
      console.error(
        `[fetch][${label}] non-OK`,
        JSON.stringify({
          method,
          url,
          status: res.status,
          correlationId: corr,
        }),
      );
    }
    return res;
  } catch (err) {
    console.error(
      `[fetch][${label}] failed`,
      JSON.stringify({
        method,
        url,
        correlationId: corr,
        message: (err as Error)?.message,
      }),
    );
    throw err;
  }
}
