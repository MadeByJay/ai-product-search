"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type ToastKind = "success" | "error";

export default function ProfileToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const toastKind: ToastKind | null = useMemo(() => {
    if (searchParams.get("ok") === "1") return "success";
    if (searchParams.get("error") === "1") return "error";
    return null;
  }, [searchParams]);

  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toastMessage: string | null = useMemo(() => {
    const message = searchParams.get("msg");
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (!toastKind) return;

    setIsVisible(true);

    const timeoutIdentifier = setTimeout(() => {
      setIsVisible(false);

      // Clean the query string so the toast does not appear again on refresh/back
      const current = new URL(window.location.href);
      current.searchParams.delete("ok");
      current.searchParams.delete("error");
      current.searchParams.delete("msg");
      const cleanPathname =
        current.pathname +
        (current.searchParams.toString() ? `?${current.searchParams}` : "");
      router.replace(cleanPathname, { scroll: false });
    }, 2800);

    return () => clearTimeout(timeoutIdentifier);
  }, [toastKind, router]);

  if (!toastKind || !isVisible) return null;

  const backgroundClassName =
    toastKind === "success"
      ? "bg-green-600 border-green-700"
      : "bg-red-600 border-red-700";

  const defaultLabel =
    toastKind === "success" ? "Preferences saved" : "Save failed";
  const defaultDescription =
    toastKind === "success"
      ? "Your preferences were updated successfully."
      : "Please try again or check the form values.";

  // The description uses the server-provided message if present
  const description = toastMessage ?? defaultDescription;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-50 max-w-sm transform transition-all"
    >
      <div
        className={`rounded-md border px-4 py-3 text-white shadow-lg ${backgroundClassName}`}
      >
        <div className="font-semibold">{defaultLabel}</div>
        <div className="text-sm opacity-90">{description}</div>
      </div>
    </div>
  );
}
