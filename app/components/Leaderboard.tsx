"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  clearLeaderboardEntries,
  getLeaderboardEntries,
} from "../lib/leaderboard";
import { getNationFlag } from "../lib/flags";

export function LeaderboardModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const entries = useMemo(() => {
    if (!open) return [];
    void refreshKey;
    return getLeaderboardEntries();
  }, [open, refreshKey]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const top20 = entries.slice(0, 20);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        aria-label="Close leaderboard"
      />
      <section
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101713] shadow-2xl sm:max-h-[85vh] sm:rounded-[1.75rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-title"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">
              Best runs
            </p>
            <h2 id="leaderboard-title" className="text-xl font-black">
              Leaderboard
            </h2>
            <p className="mt-1 text-[10px] font-bold text-white/35">
              Leaderboard on this device
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-xl text-white/70 hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {top20.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/40">
              No runs saved yet. Complete a tournament and save your score.
            </p>
          ) : (
            <ol className="space-y-2">
              {top20.map((entry, index) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg font-black text-[#d8b75b]/60">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-black">
                          {getNationFlag(entry.nation)} {entry.name}
                        </p>
                        <span className="shrink-0 text-xl font-black text-[#f6dc86]">
                          {entry.score}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-white/45">
                        {entry.nation} · {entry.finish}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-white/30">
                        {entry.scoreTitle} · {entry.record} · GF {entry.goalsFor}{" "}
                        GA {entry.goalsAgainst}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {entries.length > 0 ? (
          <footer className="shrink-0 border-t border-white/10 p-3">
            <button
              type="button"
              onClick={() => {
                clearLeaderboardEntries();
                setRefreshKey((current) => current + 1);
              }}
              className="min-h-11 w-full rounded-xl border border-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white/40 hover:bg-white/5 hover:text-white/60"
            >
              Clear local leaderboard
            </button>
          </footer>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}

export function SaveToLeaderboardModal({
  open,
  defaultName,
  onClose,
  onSave,
}: {
  open: boolean;
  defaultName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  if (!open) return null;

  return createPortal(
    <SaveToLeaderboardForm
      defaultName={defaultName}
      onClose={onClose}
      onSave={onSave}
    />,
    document.body,
  );
}

function SaveToLeaderboardForm({
  defaultName,
  onClose,
  onSave,
}: {
  defaultName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        aria-label="Close"
      />
      <section
        className="relative w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#101713] p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-black">Save to Leaderboard</h2>
        <p className="mt-1 text-xs text-white/45">
          Enter a display name for this run.
        </p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Anonymous"
          className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#d8b75b]/60"
          autoFocus
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(name.trim() || "Anonymous")}
            className="min-h-11 rounded-xl bg-[#d8b75b] px-4 py-3 text-xs font-black uppercase tracking-wider text-black"
          >
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
