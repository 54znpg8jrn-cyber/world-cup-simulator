import type { ShareCardData } from "../components/ShareCard";

export async function generateShareCardBlob(
  element: HTMLElement,
): Promise<Blob> {
  if (!element) throw new Error("Share card element missing");

  if ("fonts" in document) {
    await document.fonts.ready;
  }

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    backgroundColor: "#06140d",
    scale: 2,
    useCORS: true,
    logging: true,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  return canvasToPngBlob(canvas);
}

export async function generateManualShareCardBlob(
  data: ShareCardData,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  const background = context.createLinearGradient(0, 0, 1080, 1920);
  background.addColorStop(0, "#173a27");
  background.addColorStop(0.52, "#06140d");
  background.addColorStop(1, "#020604");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(216, 183, 91, 0.12)";
  context.lineWidth = 2;
  for (let x = 60; x < canvas.width; x += 80) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 60; y < canvas.height; y += 80) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  context.textAlign = "center";
  context.fillStyle = "#d8b75b";
  context.font = "900 34px Arial, sans-serif";
  context.fillText("WORLD CUP SIMULATOR", 540, 120);

  context.fillStyle = "rgba(255,255,255,0.5)";
  context.font = "900 26px Arial, sans-serif";
  context.fillText("WORLD CUP SCORE", 540, 360);

  context.fillStyle = "#f6dc86";
  context.font = "900 360px Arial, sans-serif";
  context.fillText(String(data.score), 540, 720);

  context.fillStyle = "#ffffff";
  context.font = "900 58px Arial, sans-serif";
  drawFittedText(context, data.scoreTitle.toUpperCase(), 540, 830, 900);

  if (data.rarity) {
    context.fillStyle = "#8cf2a7";
    context.font = "800 34px Arial, sans-serif";
    context.fillText(data.rarity.toUpperCase(), 540, 895);
  }

  drawInfoCard(context, 90, 1110, 900, 260, data.nation.name, data.finish);

  context.fillStyle = "#d8b75b";
  context.font = "900 44px Arial, sans-serif";
  context.fillText("CAN YOU BEAT MY SCORE?", 540, 1690);

  context.fillStyle = "rgba(255,255,255,0.45)";
  context.font = "700 24px Arial, sans-serif";
  context.fillText("BUILD YOURS AT WORLD CUP SIMULATOR", 540, 1800);

  return canvasToPngBlob(canvas);
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  if (typeof canvas.toBlob === "function") {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
    if (blob) return blob;
  }

  const dataUrl = canvas.toDataURL("image/png");
  const response = await fetch(dataUrl);
  const fallbackBlob = await response.blob();
  if (!fallbackBlob.size) throw new Error("Canvas PNG export returned empty data");
  return fallbackBlob;
}

function drawNationBadge(
  context: CanvasRenderingContext2D,
  code: string,
  centerX: number,
  top: number,
) {
  roundedRect(context, centerX - 105, top - 55, 210, 110, 28);
  context.fillStyle = "#f7f0d5";
  context.fill();
  context.fillStyle = "#123522";
  context.font = "900 46px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(code, centerX, top + 16);
}

function drawInfoCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
) {
  roundedRect(context, x, y, width, height, 30);
  context.fillStyle = "rgba(0, 0, 0, 0.28)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.lineWidth = 2;
  context.stroke();

  context.textAlign = "left";
  context.fillStyle = "rgba(255,255,255,0.45)";
  context.font = "900 58px Arial, sans-serif";
  drawFittedText(context, label.toUpperCase(), x + 40, y + 92, width - 80, "left");

  context.fillStyle = "#f6dc86";
  context.font = "900 34px Arial, sans-serif";
  drawFittedText(context, value.toUpperCase(), x + 40, y + 170, width - 80, "left");
  context.textAlign = "center";
}

function drawFittedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  align: CanvasTextAlign = "center",
) {
  context.textAlign = align;
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }

  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((item, index) => {
    context.fillText(item, x, y + index * 48);
  });
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
