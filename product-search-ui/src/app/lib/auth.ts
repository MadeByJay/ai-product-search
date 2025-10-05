import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

export async function requireSession(): Promise<Session> {
  const session = await getServerSession();

  if (!session?.user?.email) return session || ({} as Session);

  return session;
}
