"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "world-cup-simulator-install-hint-dismissed";

export function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone);

    let dismissed = false;
    try {
      dismissed = Boolean(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      // The hint still works when storage is unavailable.
    }

    const timer = window.setTimeout(() => {
      if (!standalone && !dismissed) setVisible(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Dismiss for the current session even when storage is unavailable.
    }
    setVisible(false);
  };

  return (
    <aside
      className="install-hint no-print fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] mx-auto w-[calc(100%-1.5rem)] max-w-sm rounded-2xl border border-emerald-300/20 bg-[#07100b]/95 p-3 shadow-2xl backdrop-blur md:hidden"
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-xs font-black text-white">
          WC
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">
            Add World Cup Simulator to your Home Screen
          </p>
          <p className="mt-1 text-xs text-white/55">
            On iPhone, tap Share → Add to Home Screen.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl text-white/50 hover:bg-white/5 hover:text-white"
          aria-label="Dismiss install hint"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
