import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { NEST_API_BASE, INTERNAL_SHARED_SECRET } from "@/app/lib/constants";
import { forbidIfMismatchedUser } from "@/app/api/_authz";
import { buildInternalSignatureHeaders } from "@/app/api/_internal-sign";

// TODO - Use this helper function
async function ensureSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      session: null as any,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, res: null as any };
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

  const pathOnly = `/profile/${userId}/saved`;
  const signatureHeaders = buildInternalSignatureHeaders({
    method: "GET",
    path: pathOnly,
    body: "",
    userId,
    sharedSecret: INTERNAL_SHARED_SECRET!,
  });

  const upstreamResponse = await fetch(`${NEST_API_BASE}${pathOnly}`, {
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

  const body = await request.json();

  const pathOnly = `/profile/${userId}/saved`;
  const signatureHeaders = buildInternalSignatureHeaders({
    method: "POST",
    path: pathOnly,
    body,
    userId,
    sharedSecret: INTERNAL_SHARED_SECRET!,
  });

  const upstreamResponse = await fetch(`${NEST_API_BASE}${pathOnly}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...signatureHeaders },
    body: JSON.stringify(body),
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
