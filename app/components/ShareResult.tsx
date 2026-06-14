"use client";

import { useRef, useState } from "react";
import { getShareUrl } from "../lib/score";
import type { ShareCardData } from "./ShareCard";
import { ShareCard } from "./ShareCard";

export function ShareResult({
  data,
}: {
  data: ShareCardData;
}) {
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const challengeText = [
    `I scored ${data.score} in World Cup Simulator.`,
    "",
    "Can you beat my score?",
    "",
    "Play here:",
    getShareUrl(),
  ].join("\n");

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
      const blob = await exportImage();
      if (!blob) {
        setMessage("Could not create the result image. Try again.");
        return;
      }
      const file = new File([blob], "world-cup-simulator-result.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: "World Cup Simulator Result",
            files: [file],
          });
          setMessage("Result shared!");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setMessage("Share cancelled.");
            return;
          }
        }
      }

      const imageUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = "world-cup-simulator-result.png";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
      setMessage("Result image downloaded!");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] text-[#f6dc86]">
        Challenge / Share
      </h2>
      <p className="mt-2 text-center text-xs text-white/45">
        Invite a friend to play, or post your result card.
      </p>

      <div className="mx-auto mt-5 grid w-full max-w-md gap-3">
        <button
          type="button"
          onClick={challengeFriend}
          disabled={busyAction !== null}
          className="min-h-12 rounded-2xl bg-[#d8b75b] px-4 py-4 text-sm font-black uppercase tracking-wider text-black hover:bg-[#f6dc86]"
        >
          {busyAction === "challenge" ? "Opening Share..." : "Challenge a Friend"}
        </button>
        <button
          type="button"
          onClick={shareResult}
          disabled={busyAction !== null}
          className="min-h-12 rounded-2xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86]"
        >
          {busyAction === "share" ? "Preparing Share..." : "Share Result"}
        </button>
      </div>
      <ShareCard data={data} exportRef={cardRef} />
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
