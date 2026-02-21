import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.pitchSession.findUnique({
      where: { id },
      select: {
        id: true,
        publicId: true,
        status: true,
        ideaText: true,
        score: true,
        verdict: true,
        vcComment: true,
        percentile: true,
        evaluationDetails: true,
        createdAt: true,
      },
    });

    if (!session) {
      return new Response("Not found", { status: 404 });
    }

    return ok(session);
  } catch (error) {
    console.error("[pitch/result]", error);
    return serverError("Failed to fetch result");
  }
}
