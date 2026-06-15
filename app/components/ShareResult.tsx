"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { getShareUrl } from "../lib/score";
import {
  generateManualShareCardBlob,
  generateShareCardBlob,
} from "../lib/share-image";
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

  const exportImage = async (): Promise<Blob> => {
    const element = cardRef.current;
    try {
      if (!element) throw new Error("Share card element missing");
      return await generateShareCardBlob(element);
    } catch (error) {
      console.error("html2canvas share card generation failed", error);
      try {
        return await generateManualShareCardBlob(data);
      } catch (fallbackError) {
        console.error("Manual share card generation failed", fallbackError);
        throw fallbackError;
      }
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
    } catch (error) {
      console.error("Share result image generation failed", error);
      setMessage("Could not create the result image. Try again.");
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
      <ShareCard data={data} />
      <CaptureShareCard data={data} exportRef={cardRef} />
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

function CaptureShareCard({
  data,
  exportRef,
}: {
  data: ShareCardData;
  exportRef: RefObject<HTMLDivElement | null>;
}) {
  const lineStyle: CSSProperties = {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    background: "rgba(0,0,0,0.25)",
    padding: "12px 14px",
    textAlign: "left",
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "-10000px",
        top: 0,
        width: 360,
        height: 640,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <div
        ref={exportRef}
        data-share-card-capture
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          width: 360,
          height: 640,
          overflow: "hidden",
          border: "1px solid rgba(216,183,91,0.3)",
          borderRadius: 28,
          background:
            "linear-gradient(160deg, #18301f 0%, #07100b 55%, #020503 100%)",
          padding: 24,
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, color: "#d8b75b", fontSize: 11, fontWeight: 900 }}>
          WORLD CUP SIMULATOR
        </p>
        <div
          style={{
            alignSelf: "center",
            marginTop: 22,
            borderRadius: 14,
            background: "#f7f0d5",
            padding: "10px 18px",
            color: "#123522",
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          {data.nation.code}
        </div>
        <p style={{ margin: "70px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 900 }}>
          WORLD CUP SCORE
        </p>
        <p style={{ margin: "2px 0 0", color: "#f6dc86", fontSize: 118, fontWeight: 900, lineHeight: 1 }}>
          {data.score}
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 20, fontWeight: 900 }}>
          {data.scoreTitle.toUpperCase()}
        </p>
        {data.rarity ? (
          <p style={{ margin: "5px 0 0", color: "#8cf2a7", fontSize: 10, fontWeight: 800 }}>
            {data.rarity.toUpperCase()}
          </p>
        ) : null}
        <div style={{ display: "grid", gap: 8, marginTop: "auto" }}>
          <div style={lineStyle}>
            <p style={{ margin: 0, color: "#ffffff", fontSize: 22, fontWeight: 900 }}>
              {data.nation.name.toUpperCase()}
            </p>
            <p style={{ margin: "5px 0 0", color: "#f6dc86", fontSize: 11, fontWeight: 900 }}>
              {data.finish.toUpperCase()}
            </p>
          </div>
        </div>
        <p style={{ margin: "auto 0 0", color: "#d8b75b", fontSize: 14, fontWeight: 900 }}>
          CAN YOU BEAT MY SCORE?
        </p>
      </div>
    </div>
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
