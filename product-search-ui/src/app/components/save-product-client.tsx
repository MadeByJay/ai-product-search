"use client";

import { useState } from "react";
import InlineToast, { InlineToastKind } from "./inline-toast";

type SaveProductClientProps = {
  productId: string;
  userId?: string | null;
  initialSaved?: boolean;
};

export default function SaveProductClient({
  productId,
  userId,
  initialSaved = false,
}: SaveProductClientProps) {
  const [isSaved, setIsSaved] = useState<boolean>(initialSaved);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [toastKey, setToastKey] = useState<number>(0);
  const [toastKind, setToastKind] = useState<InlineToastKind | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  function showToast(kind: InlineToastKind, message: string) {
    setToastKind(kind);
    setToastMessage(message);
    setToastKey((k) => k + 1);
  }

  async function attemptSave() {
    if (!userId) {
      showToast("info", "Please sign in to save items.");
      return;
    }

    const previous = isSaved;
    setIsSubmitting(true);
    setIsSaved(!previous); // optimistic

    try {
      const response = await fetch(`/api/profile/${userId}/saved`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) {
        setIsSaved(previous);
        showToast("error", "Could not save item. Tap to dismiss.");
      } else {
        showToast("success", "Saved to profile.");
      }
    } catch {
      setIsSaved(previous);
      showToast("error", "Network error. Tap to dismiss.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={attemptSave}
        disabled={isSubmitting}
        className={`rounded-md px-3 py-2 text-sm ${
          isSaved
            ? "bg-blue-600 text-white"
            : "border border-blue-600 text-blue-600 hover:bg-blue-50"
        } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {isSubmitting ? "Saving…" : isSaved ? "Saved" : "Save"}
      </button>

      {/* Toast overlay near the button */}
      {toastKind && (
        <div
          key={toastKey}
          className="pointer-events-none absolute -bottom-10 right-0"
        >
          <InlineToast
            kind={toastKind}
            message={toastMessage}
            onClose={() => {}}
          />
        </div>
      )}
    </div>
  );
}
