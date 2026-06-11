"use client";

import { useState } from "react";
import type {
  Nation,
  TournamentAwards,
  TournamentStats,
} from "../lib/types";

export interface ShareResultData {
  nation: Nation;
  finish: string;
  stats: TournamentStats;
  topScorer?: [string, number];
  mvp?: string;
  awards: TournamentAwards;
}

export function ShareResult({ data }: { data: ShareResultData }) {
  const [message, setMessage] = useState("");

  const createImage = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");

    const background = context.createLinearGradient(0, 0, 1080, 1920);
    background.addColorStop(0, "#14251b");
    background.addColorStop(0.55, "#07100b");
    background.addColorStop(1, "#020503");
    context.fillStyle = background;
    context.fillRect(0, 0, 1080, 1920);

    context.strokeStyle = "rgba(216,183,91,.12)";
    context.lineWidth = 2;
    for (let x = -600; x < 1400; x += 120) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + 700, 1920);
      context.stroke();
    }

    context.textAlign = "center";
    context.fillStyle = "#d8b75b";
    context.font = "900 34px Arial";
    context.fillText("WORLD CUP SIMULATOR", 540, 125);

    context.font = "120px Arial";
    context.fillText(data.nation.flag, 540, 320);
    context.fillStyle = "#f7f5ec";
    context.font = "900 76px Arial";
    context.fillText(data.nation.name.toUpperCase(), 540, 430);
    context.fillStyle = "#f6dc86";
    context.font = "900 44px Arial";
    context.fillText(data.finish.toUpperCase(), 540, 505);

    drawPanel(context, 90, 590, 900, 230);
    context.fillStyle = "#8cf2a7";
    context.font = "900 24px Arial";
    context.fillText("TOURNAMENT RECORD", 540, 650);
    context.fillStyle = "#ffffff";
    context.font = "900 58px Arial";
    context.fillText(
      `${data.stats.wins}W  ${data.stats.draws}D  ${data.stats.losses}L`,
      540,
      730,
    );
    context.fillStyle = "rgba(255,255,255,.55)";
    context.font = "700 27px Arial";
    context.fillText(
      `GOALS FOR ${data.stats.goalsFor}  /  AGAINST ${data.stats.goalsAgainst}`,
      540,
      785,
    );

    drawPanel(context, 90, 865, 900, 335);
    sectionTitle(context, "YOUR TEAM AWARDS", 540, 930, "#8cf2a7");
    awardLine(
      context,
      "TOP SCORER",
      data.topScorer
        ? `${data.topScorer[0]} · ${data.topScorer[1]} goals`
        : "No goals scored",
      1010,
    );
    awardLine(context, "MVP", data.mvp ?? "–", 1120);

    drawPanel(context, 90, 1245, 900, 430);
    sectionTitle(context, "WORLD CUP AWARDS", 540, 1310, "#f6dc86");
    awardLine(
      context,
      "WINNER",
      `${data.awards.winner.flag} ${data.awards.winner.name}`,
      1390,
    );
    awardLine(
      context,
      "TOP SCORER",
      `${data.awards.goldenBoot.name} · ${data.awards.goldenBoot.goals} goals`,
      1500,
    );
    awardLine(
      context,
      "TOURNAMENT MVP",
      data.awards.playerOfTournament.name,
      1610,
    );

    context.fillStyle = "rgba(255,255,255,.42)";
    context.font = "700 24px Arial";
    context.fillText("Build yours at World Cup Simulator", 540, 1815);

    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Image export failed"))),
        "image/png",
      ),
    );
  };

  const download = async () => {
    const blob = await createImage();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${data.nation.name.toLowerCase().replaceAll(" ", "-")}-world-cup-result.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Result image downloaded.");
  };

  const share = async () => {
    const blob = await createImage();
    const file = new File([blob], "world-cup-result.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "My World Cup Simulator Result",
        text: `${data.nation.name}: ${data.finish}`,
        files: [file],
      });
      setMessage("Share sheet opened.");
      return;
    }
    await download();
    setMessage("Sharing is unavailable here, so the image was downloaded.");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setMessage("Link copied.");
  };

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] text-[#f6dc86]">
        Share Your Result
      </h2>
      <div className="social-poster mx-auto my-5 flex aspect-[9/16] w-full max-w-[18rem] flex-col overflow-hidden rounded-[2rem] border border-[#d8b75b]/25 bg-[linear-gradient(160deg,#18301f,#07100b_55%,#020503)] p-5 text-center shadow-[0_25px_80px_rgba(0,0,0,.45)]">
        <p className="text-[9px] font-black uppercase tracking-[0.26em] text-[#d8b75b]">
          World Cup Simulator
        </p>
        <span className="mt-5 text-6xl">{data.nation.flag}</span>
        <h3 className="mt-2 text-2xl font-black uppercase">{data.nation.name}</h3>
        <p className="mt-1 text-xs font-black uppercase tracking-wider text-[#f6dc86]">
          {data.finish}
        </p>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[8px] font-black uppercase tracking-widest text-white/35">
            Tournament record
          </p>
          <p className="mt-1 text-xl font-black">
            {data.stats.wins}W · {data.stats.draws}D · {data.stats.losses}L
          </p>
          <p className="mt-1 text-[9px] text-white/45">
            GF {data.stats.goalsFor} · GA {data.stats.goalsAgainst}
          </p>
        </div>
        <div className="mt-3 grid gap-2 text-left">
          <PosterLine label="Your Top Scorer" value={data.topScorer ? `${data.topScorer[0]} · ${data.topScorer[1]}` : "No goals"} />
          <PosterLine label="Your MVP" value={data.mvp ?? "–"} />
          <PosterLine label="World Cup Winner" value={`${data.awards.winner.flag} ${data.awards.winner.name}`} />
          <PosterLine label="Tournament MVP" value={data.awards.playerOfTournament.name} />
        </div>
        <p className="mt-auto text-[8px] font-bold text-white/30">
          Build yours at World Cup Simulator
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <button onClick={download} className="rounded-2xl bg-[#d8b75b] px-4 py-3 text-xs font-black uppercase tracking-wider text-black">
          Download Result Image
        </button>
        <button onClick={share} className="rounded-2xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86]">
          Share Result
        </button>
        <button onClick={copyLink} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider">
          Copy Link
        </button>
      </div>
      {message ? <p className="mt-2 text-center text-xs font-bold text-white/45">{message}</p> : null}
    </section>
  );
}

function PosterLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
      <p className="text-[7px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 truncate text-[10px] font-black">{value}</p>
    </div>
  );
}

function drawPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.fillStyle = "rgba(255,255,255,.055)";
  context.strokeStyle = "rgba(255,255,255,.12)";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(x, y, width, height, 35);
  context.fill();
  context.stroke();
}

function sectionTitle(
  context: CanvasRenderingContext2D,
  title: string,
  x: number,
  y: number,
  color: string,
) {
  context.fillStyle = color;
  context.font = "900 25px Arial";
  context.fillText(title, x, y);
}

function awardLine(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  y: number,
) {
  context.fillStyle = "rgba(255,255,255,.4)";
  context.font = "800 22px Arial";
  context.fillText(label, 540, y);
  context.fillStyle = "#ffffff";
  context.font = "900 34px Arial";
  context.fillText(value, 540, y + 45);
}
