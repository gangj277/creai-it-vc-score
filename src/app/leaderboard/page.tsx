import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { VerdictKey } from "@/lib/verdicts";
import LeaderboardClient from "./leaderboard-client";

export const metadata: Metadata = {
  title: "리더보드 | AI VC 투자 심사 | CREAI+IT",
  description: "AI VC가 심사한 모든 아이디어를 점수 순으로 확인하세요. 내 아이디어는 몇 등일까?",
};

export default async function LeaderboardPage() {
  const sessions = await prisma.pitchSession.findMany({
    where: { status: "COMPLETED" },
    orderBy: { score: "desc" },
    select: {
      id: true,
      ideaText: true,
      score: true,
      verdict: true,
      percentile: true,
      createdAt: true,
    },
  });

  const entries = sessions
    .filter((s): s is typeof s & { score: number; verdict: string } => s.score != null && s.verdict != null)
    .map((s) => ({
      id: s.id,
      ideaText: s.ideaText.length > 80 ? s.ideaText.slice(0, 80) + "..." : s.ideaText,
      score: s.score,
      verdict: s.verdict as VerdictKey,
      percentile: s.percentile,
      createdAt: s.createdAt.toISOString(),
    }));

  return <LeaderboardClient entries={entries} />;
}
