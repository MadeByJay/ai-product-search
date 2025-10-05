import type { Session } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Returns NextResponse if forbidden, otherwise undefined.
 * Call early in the route handler after you have session and route userId.
 */
export function forbidIfMismatchedUser(session: Session, routeUserId: string) {
  const sessionUserId = (session.user as any)?.id as string | undefined | null;
  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (sessionUserId !== routeUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return undefined;
}
