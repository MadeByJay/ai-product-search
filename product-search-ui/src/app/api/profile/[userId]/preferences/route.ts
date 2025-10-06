import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { API_BASE, INTERNAL_SHARED_SECRET } from "@/app/lib/constants";
import { forbidIfMismatchedUser } from "@/app/api/_authz";
import { buildInternalSignatureHeaders } from "../../../_internal-sign";

/**
 * Derive a short user-safe message from a JSON payload returned by the API.
 * This assumes server (Nest filter) has already sanitized the message.
 * We still sanitize and bound length here for further security.
 */
function deriveUserSafeMessage(possibleJson: unknown): string {
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
    if (!candidate) return "";

    // Sanitize: remove control characters and trim
    candidate = candidate.replace(/[\r\n\t\f\v]+/g, " ").trim();

    // Bound length to avoid massive URLs
    if (candidate.length > 140) candidate = candidate.slice(0, 137) + "...";

    return candidate;
  } catch {
    return "";
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await context.params;
  const forbid = forbidIfMismatchedUser(session, userId);
  if (forbid) return forbid;

  const pathOnly = `/profile/${userId}/preferences`;
  const signatureHeaders = buildInternalSignatureHeaders({
    method: "GET",
    path: pathOnly,
    body: "",
    userId,
    sharedSecret: INTERNAL_SHARED_SECRET,
  });

  const upstreamResponse = await fetch(`${API_BASE}${pathOnly}`, {
    method: "GET",
    headers: { ...signatureHeaders },
    cache: "no-store",
  });

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await context.params;
  const forbid = forbidIfMismatchedUser(session, userId);
  if (forbid) return forbid;

  const contentType = request.headers.get("content-type") || "";
  const acceptJson = request.headers.get("x-accept-json") === "1";

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
  const pathOnly = `/profile/${userId}/preferences`;
  const signatureHeaders = buildInternalSignatureHeaders({
    method: "POST",
    path: pathOnly,
    body: outgoingBody,
    userId,
    sharedSecret: INTERNAL_SHARED_SECRET,
  });

  const upstreamResponse = await fetch(`${API_BASE}${pathOnly}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...signatureHeaders },
    body: JSON.stringify(outgoingBody),
  });

  // If the client explicitly wants JSON, pass upstream JSON through
  if (acceptJson) {
    const text = await upstreamResponse.text();
    return new NextResponse(text, {
      status: upstreamResponse.status,
      headers: {
        "content-type":
          upstreamResponse.headers.get("content-type") ?? "application/json",
      },
    });
  }

  // Extract a short, user-safe message if available
  let userSafeMessage: string;
  try {
    const cloned = upstreamResponse.clone();
    const json = await cloned.json();
    userSafeMessage = deriveUserSafeMessage(json);
  } catch {
    userSafeMessage = "";
  }

  // Redirect back to /profile with ok/error flag and optional msg
  const currentUrl = new URL(request.url);
  const redirectTarget = new URL("/profile", currentUrl.origin);
  redirectTarget.searchParams.set(upstreamResponse.ok ? "ok" : "error", "1");
  if (userSafeMessage) redirectTarget.searchParams.set("msg", userSafeMessage);

  return NextResponse.redirect(redirectTarget, 303);
}
