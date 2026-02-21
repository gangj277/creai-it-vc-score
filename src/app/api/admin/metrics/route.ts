import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { ok, serverError, unauthorized } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    if (!admin) {
      return unauthorized();
    }

    const [
      pitchCount,
      completedCount,
      failedCount,
      avgScore,
      unicornCount,
      seedCount,
      holdCount,
      comeBackCount,
      resultViews,
      landingClicks,
      applyClicks,
      shareCount,
    ] = await Promise.all([
      prisma.pitchSession.count(),
      prisma.pitchSession.count({ where: { status: "COMPLETED" } }),
      prisma.pitchSession.count({ where: { status: "FAILED" } }),
      prisma.pitchSession.aggregate({ _avg: { score: true }, where: { status: "COMPLETED" } }),
      prisma.pitchSession.count({ where: { verdict: "UNICORN" } }),
      prisma.pitchSession.count({ where: { verdict: "SEED" } }),
      prisma.pitchSession.count({ where: { verdict: "HOLD" } }),
      prisma.pitchSession.count({ where: { verdict: "COME_BACK" } }),
      prisma.eventLog.count({ where: { eventName: "result_view" } }),
      prisma.eventLog.count({ where: { eventName: "cta_landing_click" } }),
      prisma.eventLog.count({ where: { eventName: "cta_apply_click" } }),
      prisma.eventLog.count({ where: { eventName: { in: ["share_link_copied", "share_native"] } } }),
    ]);

    return ok({
      pitchCount,
      completedCount,
      failedCount,
      averageScore: Math.round(avgScore._avg.score ?? 0),
      verdictDistribution: {
        unicorn: unicornCount,
        seed: seedCount,
        hold: holdCount,
        comeBack: comeBackCount,
      },
      resultViews,
      landingClicks,
      applyClicks,
      shareCount,
    });
  } catch (error) {
    console.error("[admin/metrics]", error);
    return serverError("Failed to fetch metrics");
  }
}
