"use client";

import { useRef, useState } from "react";
import { buildChallengeText } from "../lib/score";
import type { ShareCardData } from "./ShareCard";
import { ShareCard } from "./ShareCard";

export function ShareResult({
  data,
  onPlayAgain,
  onChangeNation,
}: {
  data: ShareCardData;
  onPlayAgain: () => void;
  onChangeNation: () => void;
}) {
  const [message, setMessage] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const challengeText = buildChallengeText({
    nation: data.nation,
    finish: data.finish,
    score: data.score,
    scoreTitle: data.scoreTitle,
    topScorer: data.topScorer,
    mvp: data.mvp,
  });

  const exportImage = async (): Promise<Blob | null> => {
    const element = cardRef.current;
    if (!element) return null;

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(element, {
      backgroundColor: "#07100b",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const downloadImage = async () => {
    const blob = await exportImage();
    if (!blob) {
      setMessage("Could not create image.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${data.nation.name.toLowerCase().replaceAll(" ", "-")}-world-cup-score-${data.score}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Result image downloaded.");
  };

  const challengeFriend = async () => {
    const blob = await exportImage();
    if (!blob) {
      await copyChallengeText();
      return;
    }

    const file = new File([blob], "world-cup-challenge.png", {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: "World Cup Simulator Challenge",
          text: challengeText,
          files: [file],
        });
        setMessage("Challenge shared.");
        return;
      } catch {
        // User cancelled or share failed — fall through.
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "World Cup Simulator Challenge",
          text: challengeText,
        });
        setMessage("Challenge text shared.");
        return;
      } catch {
        // Fall through to clipboard.
      }
    }

    await copyChallengeText();
  };

  const copyChallengeText = async () => {
    try {
      await navigator.clipboard.writeText(challengeText);
      setMessage("Challenge text copied to clipboard.");
    } catch {
      setMessage("Could not copy text. Try downloading the image instead.");
    }
  };

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] text-[#f6dc86]">
        Share Your Result
      </h2>

      <ShareCard data={data} exportRef={cardRef} />

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={challengeFriend}
          className="rounded-2xl bg-[#d8b75b] px-4 py-4 text-sm font-black uppercase tracking-wider text-black hover:bg-[#f6dc86]"
        >
          🔥 Challenge a Friend
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={downloadImage}
            className="rounded-2xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86]"
          >
            Download Result Image
          </button>
          <button
            type="button"
            onClick={copyChallengeText}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider"
          >
            Copy Challenge Text
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-white/10"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onChangeNation}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-white/10"
          >
            Change Nation
          </button>
        </div>
      </div>
      {message ? (
        <p className="mt-3 text-center text-xs font-bold text-white/45">
          {message}
        </p>
      ) : null}
    </section>
  );
}
