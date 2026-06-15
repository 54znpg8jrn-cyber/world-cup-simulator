"use client";

import type { RefObject } from "react";
import type { Nation } from "../lib/types";
import { NationFlag } from "./NationFlag";

export interface ShareCardData {
  nation: Nation;
  finish: string;
  score: number;
  scoreTitle: string;
  rarity?: string;
  topScorer?: string;
  mvp?: string;
}

export function ShareCard({
  data,
  exportRef,
}: {
  data: ShareCardData;
  exportRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={exportRef}
      className="share-card relative mx-auto mt-5 flex aspect-[9/16] w-full max-w-[18rem] flex-col overflow-hidden rounded-[2rem] border border-[#d8b75b]/25 bg-[linear-gradient(160deg,#18301f,#07100b_55%,#020503)] p-5 text-center shadow-[0_25px_80px_rgba(0,0,0,.45)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(216,183,91,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(216,183,91,.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <p className="relative z-10 text-[9px] font-black uppercase tracking-[0.26em] text-[#d8b75b]">
        World Cup Simulator
      </p>

      <div className="relative z-10 my-auto flex flex-col items-center">
        <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/35">
          World Cup Score
        </p>
        <p className="mt-1 text-8xl font-black leading-none text-[#f6dc86]">
          {data.score}
        </p>
        <p className="mt-3 text-lg font-black uppercase text-white/90">{data.scoreTitle}</p>
        {data.rarity ? (
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#8cf2a7]/80">
            {data.rarity}
          </p>
        ) : null}
      </div>

      <div className="relative z-10 rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
        <NationFlag nation={data.nation.name} className="text-4xl" />
        <h3 className="mt-2 text-xl font-black uppercase">{data.nation.name}</h3>
        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#f6dc86]">
          {data.finish}
        </p>
      </div>

      <div className="relative z-10 mt-5">
        <p className="text-xs font-black uppercase tracking-wider text-[#d8b75b]">
          Can you beat my score?
        </p>
        <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
          World Cup Simulator
        </p>
      </div>
    </div>
  );
}
