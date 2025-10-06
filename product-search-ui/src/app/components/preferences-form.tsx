"use client";

import { useState } from "react";
import { UserPreferences } from "../lib/types";

type PreferencesFormProps = {
  userId: string;
  initial: UserPreferences;
};

type ErrorDetail = { field?: string; message: string };
type ErrorPayload = {
  ok: false;
  code?: string;
  message?: string;
  details?: ErrorDetail[];
};

export default function PreferencesForm({
  userId,
  initial,
}: PreferencesFormProps) {
  const [defaultCategory, setDefaultCategory] = useState(
    initial.default_category ?? "",
  );
  const [priceMax, setPriceMax] = useState<number | string>(
    initial.price_max ?? "",
  );
  const [pageLimit, setPageLimit] = useState<number | string>(
    initial.page_limit ?? 24,
  );
  const [theme, setTheme] = useState(initial.theme ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  function setFieldError(field: string, message: string) {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  }

  function clearFieldErrors() {
    setFieldErrors({});
    setFormError(undefined);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFieldErrors();
    setIsSaved(false);
    setIsSubmitting(true);

    const body = {
      default_category: defaultCategory || undefined,
      price_max: priceMax === "" ? undefined : Number(priceMax),
      page_limit: pageLimit === "" ? undefined : Number(pageLimit),
      theme: theme || undefined,
    };

    try {
      const response = await fetch(`/api/profile/${userId}/preferences`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-accept-json": "1", // tell proxy to return JSON instead of redirect
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => ({}))) as ErrorPayload;
        // Map details[] -> inline field errors if available
        if (Array.isArray(payload.details)) {
          payload.details.forEach((d) => {
            if (d.field) setFieldError(d.field, d.message);
          });
        }
        setFormError(payload.message || "Unable to save preferences.");
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsSaved(true);
    } catch (error) {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid max-w-md gap-3 rounded-md border bg-gray-50 p-4 text-sm"
    >
      <label className="grid gap-1">
        <span>Default category</span>
        <input
          name="default_category"
          value={defaultCategory}
          onChange={(e) => setDefaultCategory(e.target.value)}
          className={`rounded-md border px-2 py-1 ${fieldErrors.default_category ? "border-red-500" : "border-gray-300"}`}
        />
        {fieldErrors.default_category && (
          <span className="text-xs text-red-600">
            {fieldErrors.default_category}
          </span>
        )}
      </label>

      <label className="grid gap-1">
        <span>Price cap</span>
        <input
          name="price_max"
          type="number"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          className={`rounded-md border px-2 py-1 ${fieldErrors.price_max ? "border-red-500" : "border-gray-300"}`}
        />
        {fieldErrors.price_max && (
          <span className="text-xs text-red-600">{fieldErrors.price_max}</span>
        )}
      </label>

      <label className="grid gap-1">
        <span>Page limit</span>
        <input
          name="page_limit"
          type="number"
          value={pageLimit}
          onChange={(e) => setPageLimit(e.target.value)}
          className={`rounded-md border px-2 py-1 ${fieldErrors.page_limit ? "border-red-500" : "border-gray-300"}`}
        />
        {fieldErrors.page_limit && (
          <span className="text-xs text-red-600">{fieldErrors.page_limit}</span>
        )}
      </label>

      <label className="grid gap-1">
        <span>Theme</span>
        <input
          name="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className={`rounded-md border px-2 py-1 ${fieldErrors.theme ? "border-red-500" : "border-gray-300"}`}
        />
        {fieldErrors.theme && (
          <span className="text-xs text-red-600">{fieldErrors.theme}</span>
        )}
      </label>

      {formError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {formError}
        </div>
      )}
      {isSaved && !formError && (
        <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
          Preferences saved.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`rounded-md bg-orange-500 px-3 py-2 text-white hover:bg-orange-600 ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {isSubmitting ? "Saving…" : "Save Preferences"}
      </button>
    </form>
  );
}
