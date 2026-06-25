"use client";

export type SquareCarouselStat = {
  label: string;
  value: string;
  highlight?: boolean;
};

export type SquareCarouselSlide = {
  kicker?: string;
  title: string;
  subtitle?: string;
  body?: string[];
  stats?: SquareCarouselStat[];
  footer?: string;
  accent?: "gold" | "green" | "rose" | "blue";
};

type ShareCarouselOptions = {
  title: string;
  text: string;
  url?: string;
  slides: [SquareCarouselSlide, SquareCarouselSlide];
  filenamePrefix: string;
  fallbackText?: string;
};

type ChallengeOptions = {
  title: string;
  text?: string;
  url: string;
};

const SIZE = 1080;
const BRAND = "WORLD CUP GAMES";

// TODO: Wire this shared carousel into Simulator, Guess the Nation, Nation Ranker,
// and Calculator result screens once their result payloads are stable.
const ACCENTS = {
  gold: "#d8b75b",
  green: "#4ade80",
  rose: "#fb7185",
  blue: "#60a5fa",
};

export async function createSquareCarousel(
  slides: [SquareCarouselSlide, SquareCarouselSlide],
  filenamePrefix = "world-cup-games",
) {
  return Promise.all(
    slides.map(async (slide, index) => {
      const blob = await renderSquareSlide(slide, index + 1);
      return new File([blob], `${filenamePrefix}-slide-${index + 1}.png`, {
        type: "image/png",
      });
    }),
  );
}

export async function shareSquareCarousel({
  title,
  text,
  url,
  slides,
  filenamePrefix,
  fallbackText,
}: ShareCarouselOptions): Promise<"shared" | "downloaded" | "copied"> {
  const copyText = [fallbackText ?? text, url].filter(Boolean).join("\n");

  try {
    const files = await createSquareCarousel(slides, filenamePrefix);
    if (navigator.share && navigator.canShare?.({ files })) {
      await navigator.share({ title, text, url, files });
      return "shared";
    }

    files.forEach((file) => downloadBlob(file, file.name));
    return "downloaded";
  } catch (error) {
    console.error("Square carousel generation/share failed", error);
    await copyToClipboard(copyText);
    return "copied";
  }
}

export async function challengeFriend({
  title,
  text = "Can you beat me in World Cup Games?",
  url,
}: ChallengeOptions): Promise<"shared" | "copied"> {
  const shareText = `${text}\n\nPlay here:\n${url}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text: shareText, url });
      return "shared";
    }
    await copyToClipboard(shareText);
    return "copied";
  } catch (error) {
    console.error("Challenge share failed", error);
    await copyToClipboard(shareText);
    return "copied";
  }
}

async function renderSquareSlide(slide: SquareCarouselSlide, slideNumber: number) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  const accent = ACCENTS[slide.accent ?? "gold"];
  drawBackground(context, accent);

  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = accent;
  context.font = "900 30px Arial, sans-serif";
  context.fillText(slide.kicker?.toUpperCase() ?? BRAND, SIZE / 2, 90);

  context.fillStyle = "#ffffff";
  context.font = "900 78px Arial, sans-serif";
  drawWrappedText(context, slide.title.toUpperCase(), SIZE / 2, 230, 860, 82, 3);

  if (slide.subtitle) {
    context.fillStyle = "rgba(255,255,255,.68)";
    context.font = "800 34px Arial, sans-serif";
    drawWrappedText(context, slide.subtitle, SIZE / 2, 420, 760, 42, 2);
  }

  if (slide.stats?.length) {
    const statsY = slide.subtitle ? 515 : 470;
    drawStats(context, slide.stats.slice(0, 4), statsY, accent);
  }

  if (slide.body?.length) {
    const bodyY = slide.stats?.length ? 760 : slide.subtitle ? 560 : 500;
    drawBody(context, slide.body.slice(0, 4), bodyY);
  }

  context.fillStyle = accent;
  context.font = "900 26px Arial, sans-serif";
  context.fillText(slide.footer ?? "Build yours at World Cup Games", SIZE / 2, 982);
  context.fillStyle = "rgba(255,255,255,.38)";
  context.font = "800 18px Arial, sans-serif";
  context.fillText(`SLIDE ${slideNumber}/2`, SIZE / 2, 1022);

  return canvasToBlob(canvas);
}

function drawBackground(context: CanvasRenderingContext2D, accent: string) {
  const gradient = context.createLinearGradient(0, 0, SIZE, SIZE);
  gradient.addColorStop(0, "#173a27");
  gradient.addColorStop(0.55, "#07140d");
  gradient.addColorStop(1, "#020604");
  context.fillStyle = gradient;
  context.fillRect(0, 0, SIZE, SIZE);

  context.strokeStyle = "rgba(255,255,255,.055)";
  context.lineWidth = 2;
  for (let offset = -SIZE; offset < SIZE * 2; offset += 72) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset + SIZE, SIZE);
    context.stroke();
  }

  context.strokeStyle = hexToRgba(accent, 0.38);
  context.lineWidth = 7;
  roundRect(context, 38, 38, SIZE - 76, SIZE - 76, 42);
  context.stroke();

  const glow = context.createRadialGradient(540, 390, 10, 540, 390, 520);
  glow.addColorStop(0, hexToRgba(accent, 0.18));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, SIZE, SIZE);
}

function drawStats(
  context: CanvasRenderingContext2D,
  stats: SquareCarouselStat[],
  y: number,
  accent: string,
) {
  const columns = stats.length > 2 ? 2 : stats.length;
  const rows = Math.ceil(stats.length / columns);
  const cardWidth = columns === 1 ? 720 : 395;
  const cardHeight = rows > 1 ? 132 : 150;
  const gap = 24;
  const startX = (SIZE - columns * cardWidth - (columns - 1) * gap) / 2;

  stats.forEach((stat, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + column * (cardWidth + gap);
    const cardY = y + row * (cardHeight + gap);
    roundRect(context, x, cardY, cardWidth, cardHeight, 28);
    context.fillStyle = stat.highlight ? hexToRgba(accent, 0.18) : "rgba(0,0,0,.25)";
    context.fill();
    context.strokeStyle = stat.highlight ? hexToRgba(accent, 0.65) : "rgba(255,255,255,.13)";
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = stat.highlight ? "#ffffff" : "#f6dc86";
    context.font = "900 42px Arial, sans-serif";
    drawFittedText(context, stat.value, x + cardWidth / 2, cardY + 62, cardWidth - 44);
    context.fillStyle = "rgba(255,255,255,.52)";
    context.font = "800 18px Arial, sans-serif";
    drawFittedText(context, stat.label.toUpperCase(), x + cardWidth / 2, cardY + 104, cardWidth - 44);
  });
}

function drawBody(context: CanvasRenderingContext2D, body: string[], y: number) {
  context.fillStyle = "rgba(0,0,0,.24)";
  roundRect(context, 110, y - 48, 860, 56 + body.length * 54, 30);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.11)";
  context.stroke();

  context.fillStyle = "#ffffff";
  context.font = "900 30px Arial, sans-serif";
  body.forEach((line, index) => drawFittedText(context, line, SIZE / 2, y + index * 54, 760));
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const lines = getLines(context, text, maxWidth).slice(0, maxLines);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => context.fillText(line, x, startY + index * lineHeight));
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
  const lines = getLines(context, text, maxWidth);
  if (lines.length > 1) {
    lines.slice(0, 2).forEach((line, index) => context.fillText(line, x, y + index * 34));
    return;
  }
  let clipped = text;
  while (clipped.length > 4 && context.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  context.fillText(`${clipped}…`, x, y);
}

function getLines(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}
