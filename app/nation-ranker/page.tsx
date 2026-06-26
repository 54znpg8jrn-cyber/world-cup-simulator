"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChallengeFriendButton } from "../components/ChallengeFriendButton";
import { ShareResultButton } from "../components/ShareResultButton";
import { getNationFlag } from "../lib/flags";
import {
  getRankingCategory,
  getRankingItemsForCategory,
  RANKING_CATEGORIES,
  type RankingItem,
} from "../lib/games/ranking-data";
import type { SquareCarouselSlide } from "../lib/share/createSquareCarousel";

type TopSize = 3 | 5 | 10;

const TOP_SIZES: TopSize[] = [3, 5, 10];

function makeRanking(categoryId: string, size: TopSize) {
  const category = getRankingCategory(categoryId);
  return getRankingItemsForCategory(category).slice(0, size);
}

export default function NationRankerPage() {
  const [categoryId, setCategoryId] = useState(RANKING_CATEGORIES[0].id);
  const [topSize, setTopSize] = useState<TopSize>(5);
  const [ranking, setRanking] = useState<RankingItem[]>(() => makeRanking(RANKING_CATEGORIES[0].id, 5));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [replaceSlot, setReplaceSlot] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const category = getRankingCategory(categoryId);
  const availableItems = useMemo(() => getRankingItemsForCategory(category), [category]);
  const defaultRanking = useMemo(() => makeRanking(categoryId, topSize), [categoryId, topSize]);
  const edited = ranking.map((item) => item.id).join("|") !== defaultRanking.map((item) => item.id).join("|");
  const url = typeof window === "undefined" ? "/nation-ranker" : `${window.location.origin}/nation-ranker`;

  const replaceOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const used = new Set(ranking.map((item) => item.id));
    return availableItems
      .filter((item) => !used.has(item.id) || item.id === ranking[replaceSlot ?? -1]?.id)
      .filter((item) => !normalized || item.label.toLowerCase().includes(normalized) || item.meta.toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [availableItems, query, ranking, replaceSlot]);

  const changeCategory = (nextCategoryId: string) => {
    setCategoryId(nextCategoryId);
    setRanking(makeRanking(nextCategoryId, topSize));
    setReplaceSlot(null);
    setQuery("");
    setMessage("");
  };

  const changeTopSize = (nextSize: TopSize) => {
    setTopSize(nextSize);
    setRanking(makeRanking(categoryId, nextSize));
    setReplaceSlot(null);
    setQuery("");
    setMessage("");
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= ranking.length) return;
    setRanking((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  const dropItem = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setRanking((current) => {
      const from = current.findIndex((item) => item.id === draggedId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDraggedId(null);
  };

  const replaceItem = (item: RankingItem) => {
    if (replaceSlot === null) return;
    setRanking((current) => current.map((entry, index) => index === replaceSlot ? item : entry));
    setReplaceSlot(null);
    setQuery("");
    setMessage("Ranking updated.");
  };

  const resetRanking = () => {
    setRanking(defaultRanking);
    setReplaceSlot(null);
    setQuery("");
    setMessage("Reset to the website ranking.");
  };

  const slides: [SquareCarouselSlide, SquareCarouselSlide] = [
    {
      kicker: "Ranking Creator",
      title: `Top ${topSize} ${category.shortLabel}?`,
      subtitle: edited ? "My edited ranking" : "Website ranking",
      body: ["Make yours. Post the debate."],
      accent: "blue",
    },
    {
      kicker: "World Cup Games",
      title: `Top ${topSize} ${category.shortLabel}`,
      body: ranking.map((item, index) => `${index + 1}. ${item.label}`),
      footer: "Create yours at World Cup Games",
      accent: "gold",
    },
  ];
  const shareText = `My Top ${topSize} ${category.shortLabel} ranking on World Cup Games.`;

  return (
    <main className="stadium-bg min-h-dvh w-full max-w-full overflow-x-hidden px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-5 sm:py-5">
      <div className="mx-auto w-full max-w-5xl min-w-0">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex min-h-11 shrink-0 items-center rounded-full border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-wider text-white/70">
              Home
            </Link>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-violet-200">Ranking creator</p>
              <h1 className="truncate text-2xl font-black tracking-[-0.05em] sm:text-4xl">Nation Ranker</h1>
            </div>
          </div>
          <div className="rounded-full border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#f6dc86]">
            TikTok-ready top lists
          </div>
        </header>

        <section className="mt-4 grid gap-3 rounded-[1.75rem] border border-violet-300/25 bg-[linear-gradient(135deg,rgba(57,39,125,.9),rgba(14,18,58,.96))] p-4 shadow-[0_24px_70px_rgba(0,0,0,.35)] sm:mt-5 sm:p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">1. Choose your debate</p>
            <label className="mt-3 block text-[10px] font-black uppercase tracking-wider text-white/40">
              Ranking category
              <select
                value={categoryId}
                onChange={(event) => changeCategory(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#07110d] px-3 text-sm font-black text-white outline-none focus:border-[#d8b75b]/50"
              >
                {RANKING_CATEGORIES.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.label}</option>
                ))}
              </select>
            </label>
            <div className="mt-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Top size</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TOP_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => changeTopSize(size)}
                    className={`min-h-12 rounded-2xl px-3 text-xs font-black uppercase tracking-wider transition active:scale-[.98] ${topSize === size ? "bg-[#d8b75b] text-black" : "border border-white/10 bg-white/5 text-white/70"}`}
                  >
                    Top {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-lg font-black tracking-[-0.03em]">{category.label}</p>
              <p className="mt-2 text-sm leading-6 text-white/60">{category.description}</p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-[#f6dc86]">
                {edited ? "Edited by you" : "Auto-generated website ranking"}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b75b]">2. Edit and post</p>
                <h2 className="text-2xl font-black tracking-[-0.05em]">Top {topSize}</h2>
              </div>
              <button type="button" onClick={resetRanking} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-wider text-white/70">
                Reset
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              {ranking.map((item, index) => (
                <article
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedId(item.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropItem(item.id)}
                  className="ranker-nation-card group flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-black/24 p-2.5 transition hover:border-violet-200/35 sm:p-3"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d8b75b] text-sm font-black text-black">{index + 1}</span>
                  <span className="shrink-0 text-xl">{item.type === "nation" ? getNationFlag(item.label) : "★"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black sm:text-base">{item.label}</p>
                    <p className="truncate text-[10px] font-bold text-white/42">{item.meta}</p>
                  </div>
                  <div className="grid shrink-0 grid-cols-2 gap-1">
                    <button type="button" aria-label={`Move ${item.label} up`} onClick={() => moveItem(index, -1)} disabled={index === 0} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-sm font-black transition active:scale-95 disabled:opacity-25">↑</button>
                    <button type="button" aria-label={`Move ${item.label} down`} onClick={() => moveItem(index, 1)} disabled={index === ranking.length - 1} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-sm font-black transition active:scale-95 disabled:opacity-25">↓</button>
                    <button type="button" onClick={() => { setReplaceSlot(index); setQuery(""); }} className="col-span-2 min-h-8 rounded-lg border border-[#d8b75b]/20 bg-[#d8b75b]/10 px-2 text-[9px] font-black uppercase tracking-wider text-[#f6dc86]">Replace</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <ChallengeFriendButton
                title="World Cup Games: Nation Ranker"
                text="Can you make a better ranking than this?"
                url={url}
                onStatus={setMessage}
                className="min-h-12 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 text-xs font-black uppercase tracking-wider text-emerald-100 transition hover:bg-emerald-300/[0.15] active:scale-[.98]"
              />
              <ShareResultButton
                title="World Cup Games: Nation Ranker"
                text={shareText}
                url={url}
                slides={slides}
                filenamePrefix="world-cup-ranking"
                fallbackText={`${shareText}\n${ranking.map((item, index) => `${index + 1}. ${item.label}`).join("\n")}\n${url}`}
                onStatus={setMessage}
                className="min-h-12 rounded-xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 text-xs font-black uppercase tracking-wider text-[#f6dc86] transition hover:bg-[#d8b75b]/15 active:scale-[.98]"
              />
            </div>
            {message ? <p className="mt-3 text-center text-xs font-bold text-[#f6dc86]">{message}</p> : null}
          </div>
        </section>
      </div>

      {replaceSlot !== null ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Replace ranking item">
          <section className="screen-enter max-h-[86dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#d8b75b]/25 bg-[#08110c] p-4 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">Replace #{replaceSlot + 1}</p>
                <h2 className="text-2xl font-black">Search {category.itemType === "player" ? "players" : "nations"}</h2>
              </div>
              <button type="button" onClick={() => setReplaceSlot(null)} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs font-black uppercase text-white/65">Close</button>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder="Type a name..."
              className="mt-4 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-bold outline-none placeholder:text-white/30 focus:border-[#d8b75b]/50"
            />
            <div className="mt-3 grid gap-2">
              {replaceOptions.map((item) => (
                <button key={item.id} type="button" onClick={() => replaceItem(item)} className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-left transition hover:bg-white/[0.08]">
                  <span className="text-lg">{item.type === "nation" ? getNationFlag(item.label) : "★"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{item.label}</span>
                    <span className="block truncate text-[10px] font-bold text-white/40">{item.meta}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
