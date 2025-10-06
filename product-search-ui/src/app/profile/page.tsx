import { cookies, headers } from "next/headers";
import { API_BASE } from "../lib/constants";
import { getRequestOrigin } from "../lib/origin";
import { Product, UserPreferences } from "../lib/types";
import { getOrSyncUserId } from "../lib/user";
import ProfileToaster from "../components/profile-toaster";
import PreferencesForm from "../components/preferences-form";

async function fetchSaved(userId: string) {
  const origin = await getRequestOrigin();
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";

  const response = await fetch(`${origin}/api/profile/${userId}/saved`, {
    cache: "no-store",
    headers: { cookie },
  });
  if (!response.ok) return [];
  return (await response.json()) as Product[];
}

async function fetchPrefs(userId: string) {
  const origin = await getRequestOrigin();
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";

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

  const [savedItems, userPreferences] = await Promise.all([
    fetchSaved(userId),
    fetchPrefs(userId),
  ]);

  return (
    <div className="space-y-8">
      <ProfileToaster />
      <h1 className="text-2xl font-semibold">Your Profile</h1>

      <section>
        <section>
          <h2 className="mb-3 text-lg font-medium">Preferences</h2>
          <PreferencesForm userId={userId} initial={userPreferences} />
        </section>

        <h2 className="mb-3 text-lg font-medium">Saved Items</h2>
        {savedItems.length === 0 ? (
          <p className="text-sm text-gray-600">No saved items yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {savedItems.map((p) => (
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
