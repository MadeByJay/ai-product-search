// import { getOrSyncUserId } from "../(lib)/user";
// import { Product, UserPreferences } from "../(lib)/types";

import { cookies, headers } from "next/headers";
import { API_BASE } from "../lib/constants";
import { getRequestOrigin } from "../lib/origin";
import { Product, UserPreferences } from "../lib/types";
import { getOrSyncUserId } from "../lib/user";
import ProfileToaster from "../components/profile-toaster";

async function fetchSaved(userId: string) {
  const origin = await getRequestOrigin();
  const cookie = (await headers()).get("cookie") ?? "";
  const response = await fetch(`${origin}/api/profile/${userId}/saved`, {
    cache: "no-store",
    headers: { cookie },
  });
  if (!response.ok) return [];
  return (await response.json()) as Product[];
}

async function fetchPrefs(userId: string) {
  const origin = await getRequestOrigin();
  const cookie = (await headers()).get("cookie") ?? "";
  const response = await fetch(`${origin}/api/profile/${userId}/preferences`, {
    cache: "no-store",
    headers: { cookie },
  });
  if (!response.ok) return {} as UserPreferences;
  return (await response.json()) as UserPreferences;
}

export default async function ProfilePage() {
  const userId = await getOrSyncUserId();
  if (!userId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  const [saved, prefs] = await Promise.all([
    fetchSaved(userId),
    fetchPrefs(userId),
  ]);

  return (
    <div className="space-y-8">
      <ProfileToaster />
      <h1 className="text-2xl font-semibold">Your Profile</h1>

      <section>
        <h2 className="mb-3 text-lg font-medium">Preferences</h2>
        <form
          action={`/api/profile/${userId}/preferences`}
          method="post"
          className="grid max-w-md gap-3 rounded-md border bg-gray-50 p-4 text-sm"
        >
          <label className="grid gap-1">
            <span>Default category</span>
            <input
              name="default_category"
              defaultValue={prefs.default_category ?? ""}
              className="rounded-md border px-2 py-1"
            />
          </label>
          <label className="grid gap-1">
            <span>Price cap</span>
            <input
              name="price_max"
              type="number"
              defaultValue={prefs.price_max ?? ""}
              className="rounded-md border px-2 py-1"
            />
          </label>
          <label className="grid gap-1">
            <span>Page limit</span>
            <input
              name="page_limit"
              type="number"
              defaultValue={prefs.page_limit ?? 24}
              className="rounded-md border px-2 py-1"
            />
          </label>
          <label className="grid gap-1">
            <span>Theme</span>
            <input
              name="theme"
              defaultValue={prefs.theme ?? ""}
              className="rounded-md border px-2 py-1"
            />
          </label>
          <button className="rounded-md bg-orange-500 px-3 py-2 text-white hover:bg-orange-600">
            Save Preferences
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Saved Items</h2>
        {saved.length === 0 ? (
          <p className="text-sm text-gray-600">No saved items yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {saved.map((p) => (
              <div key={p.id} className="rounded-md border p-3">
                <div className="font-semibold">{p.title}</div>
                <div className="text-xs text-gray-500">
                  ${p.price} · {p.category || "General"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
