"use client";

import { useState } from "react";
import {
  shareSquareCarousel,
  type SquareCarouselSlide,
} from "../lib/share/createSquareCarousel";

export function ShareResultButton({
  title,
  text,
  url,
  slides,
  filenamePrefix,
  fallbackText,
  className,
  onStatus,
}: {
  title: string;
  text: string;
  url?: string;
  slides: readonly SquareCarouselSlide[];
  filenamePrefix: string;
  fallbackText?: string;
  className?: string;
  onStatus?: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const result = await shareSquareCarousel({
            title,
            text,
            url,
            slides,
            filenamePrefix,
            fallbackText,
          });
          onStatus?.(
            result === "shared"
              ? "Result shared!"
              : result === "downloaded"
                ? "Result carousel downloaded!"
                : "Result copied!",
          );
        } finally {
          setBusy(false);
        }
      }}
      className={className}
    >
      {busy ? (slides.length === 1 ? "Creating Image..." : "Creating Carousel...") : "Share Result"}
    </button>
  );
}
