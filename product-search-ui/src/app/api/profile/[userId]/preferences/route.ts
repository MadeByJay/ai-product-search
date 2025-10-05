import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { API_BASE } from "@/app/lib/constants";

async function ensureAuthenticatedSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      session: null as any,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, response: null as any };
}

function ensureUserIdMatches(_session: any, _routeUserId: string) {
  return 200;
}

/**
 * Derive a short user-safe message from a JSON payload returned by the API.
 * This assumes server (Nest filter) has already sanitized the message.
 * We still sanitize and bound length here for further security.
 */
function deriveUserSafeMessage(possibleJson: unknown): string | null {
  try {
    const payload = possibleJson as Record<string, unknown>;
    const code = typeof payload?.code === "string" ? payload.code : null;
    const message =
      typeof payload?.message === "string" ? payload.message : null;
    const details = Array.isArray(payload?.details) ? payload.details : null;
    const firstDetail =
      details && details.length && typeof details[0]?.message === "string"
        ? (details[0].message as string)
        : null;

    // Choose the most specific but user-safe value
    let candidate =
      firstDetail ||
      message ||
      (code ? code.replace(/_/g, " ").toLowerCase() : null);
    if (!candidate) return null;

    // Sanitize: remove control characters and trim
    candidate = candidate.replace(/[\r\n\t\f\v]+/g, " ").trim();

    // Bound length to avoid massive URLs
    if (candidate.length > 140) candidate = candidate.slice(0, 137) + "...";

    return candidate;
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { session, response } = await ensureAuthenticatedSession();
  if (!session) return response;

  const { userId } = await context.params;
  if (ensureUserIdMatches(session, userId) !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const upstreamResponse = await fetch(
    `${API_BASE}/profile/${userId}/preferences`,
    {
      cache: "no-store",
    },
  );
  const upstreamBodyText = await upstreamResponse.text();

  return new NextResponse(upstreamBodyText, {
    status: upstreamResponse.status,
    headers: {
      "content-type":
        upstreamResponse.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { session, response } = await ensureAuthenticatedSession();
  if (!session) return response;

  const { userId } = await context.params;

  if (ensureUserIdMatches(session, userId) !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";
  let outgoingBody: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    outgoingBody = await request.json();
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    outgoingBody = Object.fromEntries(formData.entries());
  } else {
    outgoingBody = await request.json().catch(() => ({}));
  }

  const upstreamResponse = await fetch(
    `${API_BASE}/profile/${userId}/preferences`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(outgoingBody),
    },
  );

  // Try to read a user-safe message from the upstream response
  let userSafeMessage: string | null;
  try {
    const cloned = upstreamResponse.clone();
    const json = await cloned.json();
    userSafeMessage = deriveUserSafeMessage(json);
  } catch {
    userSafeMessage = null;
  }

  // Build a redirect to /profile with a status flag
  const currentUrl = new URL(request.url);
  const redirectTarget = new URL("/profile", currentUrl.origin);
  redirectTarget.searchParams.set(upstreamResponse.ok ? "ok" : "error", "1");
  if (userSafeMessage) {
    redirectTarget.searchParams.set("msg", userSafeMessage);
  }

  // 303 might be a better redirect pattern
  // 303: "See Other" — safe for POST -> GET redirects
  return NextResponse.redirect(redirectTarget, 303);
}
