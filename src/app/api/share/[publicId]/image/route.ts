import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/http";
import { getVerdictByKey } from "@/lib/verdicts";
import type { VerdictKey } from "@/lib/verdicts";

export const runtime = "nodejs";

function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split("");
  const lines: string[] = [];
  let currentLine = "";

  for (const char of words) {
    if (currentLine.length >= maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;

    const session = await prisma.pitchSession.findUnique({
      where: { publicId },
    });

    if (!session || session.status !== "COMPLETED" || !session.score || !session.verdict) {
      return new Response("Not found", { status: 404 });
    }

    const verdictConfig = getVerdictByKey(session.verdict as VerdictKey);
    const comment = escapeXml(session.vcComment ?? "").slice(0, 120);
    const commentLines = wrapText(comment, 28);
    const ideaText = escapeXml(session.ideaText).slice(0, 60);
    const verdictColor = verdictConfig.color;

    const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1080" y2="1920" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B132B"/>
      <stop offset="1" stop-color="#1C2541"/>
    </linearGradient>
    <linearGradient id="accent" x1="220" y1="560" x2="860" y2="1220" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="${verdictColor}"/>
      <stop offset="1" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <circle cx="540" cy="850" r="360" fill="url(#accent)" fill-opacity="0.1"/>

  <!-- Header -->
  <text x="540" y="200" text-anchor="middle" fill="#64748B" font-family="Arial, sans-serif" font-size="40" font-weight="600" letter-spacing="4">AI VC 투자 심사 결과</text>

  <!-- CREAI+IT Brand -->
  <text x="540" y="280" text-anchor="middle" fill="#38BDF8" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="2">CREAI+IT</text>

  <!-- Idea Text -->
  <rect x="120" y="340" width="840" height="80" rx="16" fill="#1A2235" fill-opacity="0.8"/>
  <text x="540" y="392" text-anchor="middle" fill="#94A3B8" font-family="Arial, sans-serif" font-size="32" font-weight="400">&quot;${ideaText}&quot;</text>

  <!-- Verdict Emoji & Label -->
  <text x="540" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="96">${verdictConfig.emoji}</text>
  <text x="540" y="660" text-anchor="middle" fill="${verdictColor}" font-family="Arial, sans-serif" font-size="56" font-weight="800">${verdictConfig.label}</text>

  <!-- Score -->
  <text x="540" y="830" text-anchor="middle" fill="#F8FAFC" font-family="Arial, sans-serif" font-size="200" font-weight="900">${session.score}</text>
  <text x="540" y="900" text-anchor="middle" fill="#64748B" font-family="Arial, sans-serif" font-size="40" font-weight="500">/ 100점</text>

  <!-- Percentile -->
  ${session.percentile ? `<text x="540" y="980" text-anchor="middle" fill="${verdictColor}" font-family="Arial, sans-serif" font-size="44" font-weight="700">상위 ${session.percentile}%</text>` : ""}

  <!-- VC Comment -->
  <rect x="100" y="1060" width="880" height="${commentLines.length * 56 + 40}" rx="20" fill="#1A2235" fill-opacity="0.6" stroke="${verdictColor}" stroke-opacity="0.3" stroke-width="1"/>
  <text x="540" y="1108" text-anchor="middle" fill="#64748B" font-family="Arial, sans-serif" font-size="28" font-weight="600">AI VC의 한마디</text>
  ${commentLines.map((line, i) => `<text x="540" y="${1160 + i * 52}" text-anchor="middle" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="36" font-weight="400">${escapeXml(line)}</text>`).join("\n  ")}

  <!-- CTA -->
  <rect x="240" y="1600" width="600" height="80" rx="40" fill="#38BDF8" fill-opacity="0.15" stroke="#38BDF8" stroke-opacity="0.4" stroke-width="1"/>
  <text x="540" y="1652" text-anchor="middle" fill="#38BDF8" font-family="Arial, sans-serif" font-size="32" font-weight="700">너도 심사받아봐!</text>

  <!-- Footer -->
  <text x="540" y="1800" text-anchor="middle" fill="#475569" font-family="Arial, sans-serif" font-size="28" font-weight="500">CREAI+IT | 연세대 AI 창업 학회</text>
  <text x="540" y="1860" text-anchor="middle" fill="#334155" font-family="Arial, sans-serif" font-size="24" font-weight="400">creai-vc.vercel.app</text>
</svg>`;

    return new Response(svg.trim(), {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[share/image]", error);
    return serverError("Failed to generate image");
  }
}
