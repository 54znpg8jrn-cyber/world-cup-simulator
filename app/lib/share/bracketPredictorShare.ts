"use client";

import { shareGeneratedImages } from "./createSquareCarousel";

export type BracketShareTeam = {
  name: string;
  code: string;
  flag: string;
};

export type BracketShareMatch = {
  id: string;
  teamA: BracketShareTeam | null;
  teamB: BracketShareTeam | null;
  winner: BracketShareTeam | null;
};

export type BracketShareRound = {
  key: "r32" | "r16" | "qf" | "sf" | "final";
  label: string;
  matches: BracketShareMatch[];
};

type ShareResult = "shared" | "downloaded" | "copied";

const SIZE = 1080;
const GOLD = "#d8b75b";
const GOLD_LIGHT = "#f6dc86";
const GREEN = "#17633f";
const GREEN_BORDER = "#4ade80";
const RED = "#5b2230";
const RED_BORDER = "#fb7185";

export function shareBracketRoundImage({
  round,
  url,
}: {
  round: BracketShareRound;
  url: string;
}): Promise<ShareResult> {
  return shareGeneratedImages({
    title: `World Cup Bracket Predictor: ${round.label}`,
    text: `My ${round.label} predictions are locked in.`,
    url,
    fallbackText: `${round.label}: ${round.matches.map(matchupText).join(", ")}`,
    createFiles: async () => [
      await createPngFile(
        () => renderRound(round),
        `world-cup-bracket-${round.key}.png`,
      ),
    ],
  });
}

export function shareWholeBracketImage({
  rounds,
  url,
}: {
  rounds: BracketShareRound[];
  url: string;
}): Promise<ShareResult> {
  const champion = rounds.find((round) => round.key === "final")?.matches[0]?.winner;
  return shareGeneratedImages({
    title: "World Cup Bracket Predictor: The Whole Bracket",
    text: `My World Cup bracket is complete. ${champion?.name ?? "My champion"} lift the trophy.`,
    url,
    fallbackText: `My World Cup champion: ${champion?.name ?? "TBD"}`,
    createFiles: async () => [
      await createPngFile(
        () => renderWholeBracket(rounds),
        "world-cup-whole-bracket.png",
      ),
    ],
  });
}

async function createPngFile(render: () => HTMLCanvasElement, filename: string) {
  const canvas = render();
  const blob = await canvasToBlob(canvas);
  return new File([blob], filename, { type: "image/png" });
}

function renderRound(round: BracketShareRound) {
  const { canvas, context } = createCanvas();
  drawBackground(context);
  drawHeader(context, round.label.toUpperCase(), `${round.matches.length} matchups · winners advance`);

  const count = round.matches.length;
  const columns = count === 1 ? 1 : 2;
  const rows = Math.ceil(count / columns);
  const gapX = 22;
  const gapY = count >= 16 ? 9 : 18;
  const contentTop = count === 1 ? 270 : 225;
  const contentBottom = 925;
  const cardWidth = columns === 1 ? 720 : (930 - gapX) / 2;
  const cardHeight = count === 1 ? 360 : Math.min(176, (contentBottom - contentTop - gapY * (rows - 1)) / rows);
  const startX = columns === 1 ? (SIZE - cardWidth) / 2 : 75;

  round.matches.forEach((match, index) => {
    const column = columns === 1 || index < rows ? 0 : 1;
    const row = columns === 1 || column === 0 ? index : index - rows;
    drawRoundMatch(
      context,
      match,
      startX + column * (cardWidth + gapX),
      contentTop + row * (cardHeight + gapY),
      cardWidth,
      cardHeight,
      count === 1,
    );
  });

  if (round.key === "final") {
    context.textAlign = "center";
    context.fillStyle = GOLD_LIGHT;
    context.font = "900 32px Arial, sans-serif";
    context.fillText("CHAMPION", SIZE / 2, 720);
    context.font = "900 48px Arial, sans-serif";
    drawFittedText(context, round.matches[0].winner?.name ?? "", SIZE / 2, 780, 780);
  }

  drawFooter(context);
  return canvas;
}

function renderWholeBracket(rounds: BracketShareRound[]) {
  const { canvas, context } = createCanvas();
  drawBackground(context);
  drawHeader(context, "THE WHOLE BRACKET", "My path to the World Cup trophy");

  const byKey = new Map(rounds.map((round) => [round.key, round]));
  const r32 = byKey.get("r32")?.matches ?? [];
  const r16 = byKey.get("r16")?.matches ?? [];
  const qf = byKey.get("qf")?.matches ?? [];
  const sf = byKey.get("sf")?.matches ?? [];
  const final = byKey.get("final")?.matches[0];

  const widths = [140, 110, 95, 85, 140, 85, 95, 110, 140];
  const gap = 8;
  const xs: number[] = [];
  let cursor = 8;
  widths.forEach((width) => {
    xs.push(cursor);
    cursor += width + gap;
  });
  const top = 245;
  const bottom = 900;

  const columns = [
    { key: "r32", x: xs[0], width: widths[0], matches: r32.slice(0, 8), side: "left" as const },
    { key: "r16", x: xs[1], width: widths[1], matches: r16.slice(0, 4), side: "left" as const },
    { key: "qf", x: xs[2], width: widths[2], matches: qf.slice(0, 2), side: "left" as const },
    { key: "sf", x: xs[3], width: widths[3], matches: sf.slice(0, 1), side: "left" as const },
    { key: "sf", x: xs[5], width: widths[5], matches: sf.slice(1, 2), side: "right" as const },
    { key: "qf", x: xs[6], width: widths[6], matches: qf.slice(2, 4), side: "right" as const },
    { key: "r16", x: xs[7], width: widths[7], matches: r16.slice(4, 8), side: "right" as const },
    { key: "r32", x: xs[8], width: widths[8], matches: r32.slice(8, 16), side: "right" as const },
  ];

  const layouts = columns.map((column) => ({
    ...column,
    cards: getCardLayouts(column.matches.length, column.x, column.width, top, bottom),
  }));

  const centerX = xs[4];
  const centerWidth = widths[4];
  const championName = final?.winner?.name ?? "TBD";
  const championFontSize = getFittedFontSize(context, championName, centerWidth - 18, 21, 13);
  const longestFinalist = Math.max(final?.teamA?.name.length ?? 0, final?.teamB?.name.length ?? 0);
  const finalCardHeight = 122 + Math.max(0, longestFinalist - 14) * 1.4;
  const finalTitleHeight = 24;
  const titleToCardGap = 12;
  const blockGap = 54;
  const championCardHeight = 82 + championFontSize;
  const stackTopBoundary = 290;
  const stackBottomBoundary = 835;
  const stackHeight = finalTitleHeight + titleToCardGap + finalCardHeight + blockGap + championCardHeight;
  const stackTop = stackTopBoundary + Math.max(0, (stackBottomBoundary - stackTopBoundary - stackHeight) / 2);
  const finalTitleY = stackTop + finalTitleHeight;
  const finalCardY = finalTitleY + titleToCardGap;
  const championCardY = finalCardY + finalCardHeight + blockGap;
  const finalCenterY = finalCardY + finalCardHeight / 2;

  context.strokeStyle = "rgba(216,183,91,.58)";
  context.lineWidth = 3;
  for (let index = 0; index < 3; index += 1) {
    drawConnectors(context, layouts[index].cards, layouts[index + 1].cards, "left");
  }
  for (let index = 4; index < 7; index += 1) {
    drawConnectors(context, layouts[index + 1].cards, layouts[index].cards, "right");
  }
  const leftSemi = layouts[3].cards[0];
  const rightSemi = layouts[4].cards[0];
  context.beginPath();
  context.moveTo(leftSemi.x + leftSemi.width, leftSemi.y + leftSemi.height / 2);
  context.lineTo(xs[4], finalCenterY);
  context.moveTo(rightSemi.x, rightSemi.y + rightSemi.height / 2);
  context.lineTo(xs[4] + widths[4], finalCenterY);
  context.stroke();

  layouts.forEach((column) => {
    context.textAlign = "center";
    context.fillStyle = "rgba(246,220,134,.78)";
    context.font = "900 15px Arial, sans-serif";
    context.fillText(column.key.toUpperCase(), column.x + column.width / 2, 222);
    column.matches.forEach((match, index) => drawMiniMatch(context, match, column.cards[index]));
  });

  context.textAlign = "center";
  context.fillStyle = GOLD_LIGHT;
  context.font = "900 17px Arial, sans-serif";
  context.fillText("FINAL", centerX + centerWidth / 2, finalTitleY);
  if (final) drawMiniMatch(context, final, { x: centerX, y: finalCardY, width: centerWidth, height: finalCardHeight });

  const connectorTop = finalCardY + finalCardHeight + 10;
  const connectorBottom = championCardY - 10;
  context.strokeStyle = "rgba(216,183,91,.75)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(centerX + centerWidth / 2, connectorTop);
  context.lineTo(centerX + centerWidth / 2, connectorBottom);
  context.stroke();
  context.fillStyle = GOLD;
  context.beginPath();
  context.moveTo(centerX + centerWidth / 2, connectorBottom + 5);
  context.lineTo(centerX + centerWidth / 2 - 6, connectorBottom - 5);
  context.lineTo(centerX + centerWidth / 2 + 6, connectorBottom - 5);
  context.closePath();
  context.fill();

  roundRect(context, centerX, championCardY, centerWidth, championCardHeight, 22);
  context.fillStyle = "rgba(216,183,91,.16)";
  context.fill();
  context.strokeStyle = "rgba(246,220,134,.72)";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = GOLD_LIGHT;
  context.font = "900 15px \"Apple Color Emoji\", \"Segoe UI Emoji\", Arial, sans-serif";
  context.fillText("🏆 CHAMPION", centerX + centerWidth / 2, championCardY + 31);
  context.fillStyle = "#ffffff";
  context.font = `900 ${championFontSize}px Arial, sans-serif`;
  drawFittedText(context, championName, centerX + centerWidth / 2, championCardY + 64, centerWidth - 18);
  if (final?.winner?.flag) {
    context.font = "900 18px \"Apple Color Emoji\", \"Segoe UI Emoji\", Arial, sans-serif";
    context.fillText(final.winner.flag, centerX + centerWidth / 2, championCardY + championCardHeight - 13);
  }

  drawFooter(context);
  return canvas;
}

function drawRoundMatch(
  context: CanvasRenderingContext2D,
  match: BracketShareMatch,
  x: number,
  y: number,
  width: number,
  height: number,
  final: boolean,
) {
  roundRect(context, x, y, width, height, 22);
  context.fillStyle = "rgba(0,0,0,.28)";
  context.fill();
  context.strokeStyle = final ? "rgba(246,220,134,.65)" : "rgba(255,255,255,.13)";
  context.lineWidth = final ? 3 : 2;
  context.stroke();

  const labelHeight = Math.max(17, Math.min(28, height * .2));
  context.textAlign = "left";
  context.fillStyle = "rgba(246,220,134,.65)";
  context.font = `900 ${Math.max(11, Math.min(16, labelHeight * .56))}px Arial, sans-serif`;
  context.fillText(match.id.replaceAll("_", " "), x + 14, y + labelHeight - 4);

  const rowGap = Math.max(3, height * .035);
  const rowHeight = (height - labelHeight - rowGap * 3) / 2;
  drawTeamRow(context, match.teamA, match.winner?.code === match.teamA?.code, x + 8, y + labelHeight + rowGap, width - 16, rowHeight, final);
  drawTeamRow(context, match.teamB, match.winner?.code === match.teamB?.code, x + 8, y + labelHeight + rowGap * 2 + rowHeight, width - 16, rowHeight, final);
}

function drawTeamRow(
  context: CanvasRenderingContext2D,
  team: BracketShareTeam | null,
  winner: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
  large: boolean,
) {
  roundRect(context, x, y, width, height, Math.min(14, height / 3));
  context.fillStyle = winner ? GREEN : RED;
  context.fill();
  context.strokeStyle = winner ? GREEN_BORDER : RED_BORDER;
  context.lineWidth = winner ? 2.5 : 1.5;
  context.stroke();

  const fontSize = Math.max(14, Math.min(large ? 32 : 22, height * .48));
  context.textAlign = "left";
  context.fillStyle = "#ffffff";
  context.font = `${winner ? 900 : 800} ${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", Arial, sans-serif`;
  const flag = team?.flag && team.flag.length <= 8 ? `${team.flag} ` : "";
  drawFittedText(context, `${flag}${team?.name ?? "TBD"}`, x + 13, y + height * .66, width - 78);
  context.textAlign = "right";
  context.fillStyle = winner ? "#bbf7d0" : "#fecdd3";
  context.font = `900 ${Math.max(10, fontSize * .52)}px Arial, sans-serif`;
  context.fillText(winner ? "WIN" : "OUT", x + width - 12, y + height * .64);
}

type CardLayout = { x: number; y: number; width: number; height: number };

function getCardLayouts(count: number, x: number, width: number, top: number, bottom: number): CardLayout[] {
  const height = count >= 8 ? 72 : count >= 4 ? 104 : count >= 2 ? 150 : 210;
  const step = count > 1 ? (bottom - top - height) / (count - 1) : 0;
  const singleY = top + (bottom - top - height) / 2;
  return Array.from({ length: count }, (_, index) => ({
    x,
    y: count === 1 ? singleY : top + index * step,
    width,
    height,
  }));
}

function drawConnectors(
  context: CanvasRenderingContext2D,
  previous: CardLayout[],
  next: CardLayout[],
  direction: "left" | "right",
) {
  next.forEach((nextCard, index) => {
    const first = previous[index * 2];
    const second = previous[index * 2 + 1];
    if (!first || !second) return;
    const previousEdge = direction === "left" ? first.x + first.width : first.x;
    const nextEdge = direction === "left" ? nextCard.x : nextCard.x + nextCard.width;
    const middleX = (previousEdge + nextEdge) / 2;
    const firstY = first.y + first.height / 2;
    const secondY = second.y + second.height / 2;
    const nextY = nextCard.y + nextCard.height / 2;
    context.beginPath();
    context.moveTo(previousEdge, firstY);
    context.lineTo(middleX, firstY);
    context.lineTo(middleX, secondY);
    context.lineTo(previousEdge, secondY);
    context.moveTo(middleX, nextY);
    context.lineTo(nextEdge, nextY);
    context.stroke();
  });
}

function drawMiniMatch(context: CanvasRenderingContext2D, match: BracketShareMatch, card: CardLayout) {
  roundRect(context, card.x, card.y, card.width, card.height, 10);
  context.fillStyle = "rgba(3,12,8,.94)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.12)";
  context.lineWidth = 1.5;
  context.stroke();

  const labelHeight = Math.min(15, card.height * .18);
  context.textAlign = "center";
  context.fillStyle = "rgba(216,183,91,.7)";
  context.font = "900 10px Arial, sans-serif";
  context.fillText(match.id.replaceAll("_", " "), card.x + card.width / 2, card.y + 12);
  const rowHeight = (card.height - labelHeight - 6) / 2;
  drawMiniTeam(context, match.teamA, match.winner?.code === match.teamA?.code, card.x + 4, card.y + labelHeight + 2, card.width - 8, rowHeight);
  drawMiniTeam(context, match.teamB, match.winner?.code === match.teamB?.code, card.x + 4, card.y + labelHeight + rowHeight + 3, card.width - 8, rowHeight);
}

function drawMiniTeam(
  context: CanvasRenderingContext2D,
  team: BracketShareTeam | null,
  winner: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  roundRect(context, x, y, width, height, 6);
  context.fillStyle = winner ? "rgba(23,99,63,.95)" : "rgba(91,34,48,.88)";
  context.fill();
  context.textAlign = "left";
  context.fillStyle = winner ? "#dcfce7" : "#ffe4e6";
  context.font = `900 ${Math.max(10, Math.min(14, height * .5))}px Arial, sans-serif`;
  const label = width < 120 ? team?.code : team?.name;
  drawFittedText(context, label ?? "TBD", x + 6, y + height * .67, width - 12);
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.textBaseline = "alphabetic";
  return { canvas, context };
}

function drawBackground(context: CanvasRenderingContext2D) {
  const gradient = context.createLinearGradient(0, 0, SIZE, SIZE);
  gradient.addColorStop(0, "#163824");
  gradient.addColorStop(.55, "#07140d");
  gradient.addColorStop(1, "#020604");
  context.fillStyle = gradient;
  context.fillRect(0, 0, SIZE, SIZE);
  context.strokeStyle = "rgba(255,255,255,.045)";
  context.lineWidth = 2;
  for (let offset = -SIZE; offset < SIZE * 2; offset += 72) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset + SIZE, SIZE);
    context.stroke();
  }
  context.strokeStyle = "rgba(216,183,91,.52)";
  context.lineWidth = 6;
  roundRect(context, 32, 32, SIZE - 64, SIZE - 64, 38);
  context.stroke();
}

function drawHeader(context: CanvasRenderingContext2D, title: string, subtitle: string) {
  context.textAlign = "center";
  context.fillStyle = GOLD;
  context.font = "900 25px Arial, sans-serif";
  context.fillText("WORLD CUP GAMES · BRACKET PREDICTOR", SIZE / 2, 82);
  context.fillStyle = "#ffffff";
  context.font = "900 58px Arial, sans-serif";
  drawFittedText(context, title, SIZE / 2, 145, 920);
  context.fillStyle = "rgba(255,255,255,.58)";
  context.font = "800 24px Arial, sans-serif";
  context.fillText(subtitle, SIZE / 2, 188);
}

function drawFooter(context: CanvasRenderingContext2D) {
  context.textAlign = "center";
  context.fillStyle = GOLD;
  context.font = "900 22px Arial, sans-serif";
  context.fillText("BRACKET PREDICTOR · WORLD CUP GAMES", SIZE / 2, 1014);
}

function matchupText(match: BracketShareMatch) {
  return `${match.teamA?.name ?? "TBD"} vs ${match.teamB?.name ?? "TBD"}: ${match.winner?.name ?? "TBD"}`;
}

function drawFittedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }
  let clipped = text;
  while (clipped.length > 3 && context.measureText(`${clipped}...`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  context.fillText(`${clipped}...`, x, y);
}

function getFittedFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maximum: number,
  minimum: number,
) {
  let size = maximum;
  while (size > minimum) {
    context.font = `900 ${size}px Arial, sans-serif`;
    if (context.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return minimum;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (blob) return blob;
  const response = await fetch(canvas.toDataURL("image/png"));
  const fallback = await response.blob();
  if (!fallback.size) throw new Error("Canvas PNG export returned empty data");
  return fallback;
}
