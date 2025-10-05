import { headers } from "next/headers";
import { requireSession } from "./auth";
import { getRequestOrigin } from "./origin";

export async function getOrSyncUserId(): Promise<string | null> {
  const session = await requireSession();
  const email = session.user?.email as string;
  if (!email) return null;

  const origin = await getRequestOrigin();
  const cookie = (await headers()).get("cookie") ?? ""; // forward auth cookies

  const response = await fetch(`${origin}/api/users/sync`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      email,
      name: session.user?.name,
      avatar_url: session.user?.image,
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const { id } = await response.json();
  return id as string;
}
