"use client";

import { useRef, useState } from "react";
import { buildChallengeText, getShareUrl } from "../lib/score";
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
  const [busyAction, setBusyAction] = useState<string | null>(null);
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

    try {
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
    } catch {
      return null;
    }
  };

  const downloadImage = async () => {
    setBusyAction("download");
    try {
      const blob = await exportImage();
      if (!blob) {
        setMessage("Image export failed. Please try again.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${data.nation.name.toLowerCase().replaceAll(" ", "-")}-world-cup-score-${data.score}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Result image downloaded!");
    } finally {
      setBusyAction(null);
    }
  };

  const challengeFriend = async () => {
    setBusyAction("challenge");
    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "World Cup Simulator Challenge",
            text: challengeText,
            url: getShareUrl(),
          });
          setMessage("Share opened!");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setMessage("Share cancelled.");
            return;
          }
        }
      }

      const copied = await copyText(challengeText);
      setMessage(
        copied
          ? "Challenge copied!"
          : "Could not copy the challenge. Try again.",
      );
    } finally {
      setBusyAction(null);
    }
  };

  const shareResult = async () => {
    setBusyAction("share");
    try {
      if (navigator.share) {
        const blob = await exportImage();
        const file = blob
          ? new File([blob], "world-cup-simulator-result.png", {
              type: "image/png",
            })
          : null;

        try {
          if (file && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              title: "World Cup Simulator Result",
              text: challengeText,
              files: [file],
            });
          } else {
            await navigator.share({
              title: "World Cup Simulator Result",
              text: challengeText,
              url: getShareUrl(),
            });
          }
          setMessage("Result shared!");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setMessage("Share cancelled.");
            return;
          }
        }
      }

      const copied = await copyText(challengeText);
      setMessage(
        copied
          ? "Share text copied!"
          : "Sharing is unavailable. Try downloading the image.",
      );
    } finally {
      setBusyAction(null);
    }
  };

  const copyChallengeText = async () => {
    setBusyAction("copy");
    const copied = await copyText(challengeText);
    setMessage(
      copied
        ? "Challenge text copied!"
        : "Could not copy text. Try downloading the image instead.",
    );
    setBusyAction(null);
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
          disabled={busyAction !== null}
          className="rounded-2xl bg-[#d8b75b] px-4 py-4 text-sm font-black uppercase tracking-wider text-black hover:bg-[#f6dc86]"
        >
          {busyAction === "challenge" ? "Opening Share..." : "Challenge a Friend"}
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={shareResult}
            disabled={busyAction !== null}
            className="rounded-2xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86]"
          >
            {busyAction === "share" ? "Preparing Share..." : "Share Result"}
          </button>
          <button
            type="button"
            onClick={downloadImage}
            disabled={busyAction !== null}
            className="rounded-2xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86]"
          >
            {busyAction === "download" ? "Creating Image..." : "Download Result Image"}
          </button>
          <button
            type="button"
            onClick={copyChallengeText}
            disabled={busyAction !== null}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider"
          >
            {busyAction === "copy" ? "Copying..." : "Copy Challenge Text"}
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
        <p
          className="mt-3 text-center text-xs font-bold text-white/60"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    } catch {
      return false;
    }
  }
}
