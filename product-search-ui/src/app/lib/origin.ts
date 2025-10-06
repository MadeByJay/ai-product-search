import { headers } from "next/headers";

export async function getRequestOrigin() {
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) throw new Error("Unable to determine request host");

  return `${protocol}://${host}`;
}
