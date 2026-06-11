"use client";

import { useMemo, useState } from "react";
import { getPlayersByNation } from "../../data/players";
import type { Nation, Player } from "../lib/types";

export function TeamManager({
  open,
  nation,
  startingXI,
  substitutionsUsed,
  onClose,
  onConfirm,
}: {
  open: boolean;
  nation: Nation;
  startingXI: Player[];
  substitutionsUsed: number;
  onClose: () => void;
  onConfirm: (outgoing: Player, incoming: Player) => void;
}) {
  const [outgoing, setOutgoing] = useState<Player | null>(null);
  const [incoming, setIncoming] = useState<Player | null>(null);
  const startingIds = useMemo(
    () => new Set(startingXI.map((player) => player.id)),
    [startingXI],
  );
  const bench = getPlayersByNation(nation.name).filter(
    (player) => !startingIds.has(player.id),
  );
  const warning =
    outgoing && incoming && outgoing.position !== incoming.position
      ? `${outgoing.position} to ${incoming.position}: this changes the shape of your XI.`
      : null;

  if (!open) return null;

  const confirm = () => {
    if (!outgoing || !incoming || substitutionsUsed >= 5) return;
    onConfirm(outgoing, incoming);
    setOutgoing(null);
    setIncoming(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close team manager"
      />
      <section className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101713] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">
              Match paused · {substitutionsUsed}/5 used
            </p>
            <h2 className="text-xl font-black">Manage team</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-xl"
          >
            ×
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-2">
          <PlayerList
            title="Starting XI"
            players={startingXI}
            selectedId={outgoing?.id}
            onSelect={setOutgoing}
          />
          <PlayerList
            title={`Bench · ${bench.length}`}
            players={bench}
            selectedId={incoming?.id}
            onSelect={setIncoming}
          />
        </div>

        <footer className="border-t border-white/10 p-4">
          <div className="mb-3 min-h-5 text-center text-xs font-bold text-amber-200">
            {warning ??
              (outgoing && incoming
                ? `${outgoing.name} off · ${incoming.name} on`
                : "Select one starter and one bench player.")}
          </div>
          <button
            disabled={!outgoing || !incoming || substitutionsUsed >= 5}
            onClick={confirm}
            className="w-full rounded-2xl bg-[#d8b75b] px-5 py-4 text-sm font-black uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
          >
            {substitutionsUsed >= 5 ? "All substitutions used" : "Confirm substitution"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function PlayerList({
  title,
  players,
  selectedId,
  onSelect,
}: {
  title: string;
  players: Player[];
  selectedId?: string;
  onSelect: (player: Player) => void;
}) {
  return (
    <section className="min-h-64 rounded-2xl border border-white/8 bg-black/20 p-3">
      <h3 className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        {title}
      </h3>
      <div className="space-y-1">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelect(player)}
            className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left ${
              selectedId === player.id
                ? "bg-[#d8b75b]/15 ring-1 ring-[#d8b75b]/50"
                : "hover:bg-white/5"
            }`}
          >
            <span className="w-8 text-center text-sm font-black text-[#8cf2a7]">
              {player.rating}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {player.name}
            </span>
            <span className="text-[10px] font-black text-white/35">
              {player.position}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
