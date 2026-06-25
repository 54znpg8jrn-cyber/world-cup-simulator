"use client";

import { useState } from "react";
import { challengeFriend } from "../lib/share/createSquareCarousel";

export function ChallengeFriendButton({
  title,
  url,
  text = "Can you beat me in World Cup Games?",
  className,
  onStatus,
}: {
  title: string;
  url: string;
  text?: string;
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
          const result = await challengeFriend({ title, text, url });
          onStatus?.(result === "shared" ? "Challenge shared!" : "Challenge copied!");
        } catch {
          onStatus?.("Challenge link copied!");
        } finally {
          setBusy(false);
        }
      }}
      className={className}
    >
      {busy ? "Opening Share..." : "Challenge a Friend"}
    </button>
  );
}
