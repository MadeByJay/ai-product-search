import { headers } from "next/headers";
import { requireSession } from "./auth";
import { NEXTAUTH_URL } from "./constants";
import { tracedFetch } from "./fetch-trace";

export async function getOrSyncUserId(): Promise<string | null> {
  const session = await requireSession();
  const email = session.user?.email as string;
  if (!email) return null;

  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";

  const response = await tracedFetch(
    "users-sync (SSR)",
    `${NEXTAUTH_URL}/api/users/sync`,
    {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      cache: "no-store",
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) return null;
  const { id } = await response.json();
  return id as string;
}
