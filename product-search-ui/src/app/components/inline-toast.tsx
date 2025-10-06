"use client";

import { useEffect, useState } from "react";

export type InlineToastKind = "success" | "error" | "info";

type InlineToastProps = {
  kind: InlineToastKind;
  message: string;
  onClose?: () => void;
  durationMs?: number;
};

export default function InlineToast({
  kind,
  message,
  onClose,
  durationMs = 2600,
}: InlineToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeoutIdentifier = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, durationMs);
    return () => clearTimeout(timeoutIdentifier);
  }, [durationMs, onClose]);

  if (!isVisible) return null;

  const backgroundClassName =
    kind === "success"
      ? "bg-green-600 border-green-700"
      : kind === "error"
        ? "bg-red-600 border-red-700"
        : "bg-gray-800 border-gray-900";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto rounded-md border px-3 py-2 text-xs text-white shadow-lg ${backgroundClassName}`}
      onClick={() => {
        setIsVisible(false);
        onClose?.();
      }}
    >
      {message}
    </div>
  );
}
