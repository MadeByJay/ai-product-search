import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { forbidIfMismatchedUser } from "@/app/api/_authz";
import { buildInternalSignatureHeaders } from "@/app/api/_internal-sign";
import { NEST_API_BASE, INTERNAL_SHARED_SECRET } from "@/app/lib/constants";

export async function GET(
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

  const ids = request.nextUrl.searchParams.get("ids") || "";
  const pathOnly = `/profile/${userId}/saved/check?ids=${encodeURIComponent(ids)}`;

  if (!INTERNAL_SHARED_SECRET) {
    // In production this should never be missing
    return NextResponse.json(
      { error: "Internal signature not configured" },
      { status: 500 },
    );
  }

  const signatureHeaders = buildInternalSignatureHeaders({
    method: "GET",
    path: pathOnly.split("?")[0], // sign path not query
    body: "", // GET has no body - fix later
    userId,
    sharedSecret: INTERNAL_SHARED_SECRET,
  });

  const upstream = await fetch(`${NEST_API_BASE}${pathOnly}`, {
    method: "GET",
    headers: { ...signatureHeaders },
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
    },
  });
}
