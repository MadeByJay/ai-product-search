import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { API_BASE } from "@/app/lib/constants";

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

// Optional strict check helper: ensure the route userId matches the signed-in user's id.
// If we store a user_id in session later, enforce it here.
function ensureUserIdMatches(_session: any, _routeUserId: string) {
  // For now we skip strict match. To enable later:
  // if (session.user.id && session.user.id !== routeUserId) return 403;
  return 200;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { session, res } = await ensureSession();
  if (!session) return res;

  const { userId } = await context.params;

  if (ensureUserIdMatches(session, userId) !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = await fetch(`${API_BASE}/profile/${userId}/saved`, {
    cache: "no-store",
  });
  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { session, res } = await ensureSession();
  if (!session) return res;

  const { userId } = await context.params;

  if (ensureUserIdMatches(session, userId) !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const response = await fetch(`${API_BASE}/profile/${userId}/saved`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}
