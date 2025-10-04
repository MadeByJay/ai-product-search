import { getSavedItems, getPreferences } from "../lib/api";
import { SavedItem, UserPreferences } from "../lib/types";
import ProductCard from "../components/product-card";
import { DEMO_USER } from "../lib/constants";

export default async function ProfilePage() {
  const [saved, prefs] = await Promise.all([
    getSavedItems(DEMO_USER),
    getPreferences(DEMO_USER),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Your Profile</h1>

      {/* Saved Items */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Saved Items</h2>
        {saved.length === 0 ? (
          <p className="text-sm text-gray-600">No saved items yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {saved.map((p: SavedItem) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Preferences */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Preferences</h2>
        <div className="rounded-md border bg-gray-50 p-4 text-sm">
          <div>Default category: {prefs.default_category || "None"}</div>
          <div>
            Price cap: {prefs.price_max ? `$${prefs.price_max}` : "Not set"}
          </div>
          <div>Page limit: {prefs.page_limit || 24}</div>
          <div>Theme: {prefs.theme || "Default"}</div>
        </div>
      </section>
    </div>
  );
}
