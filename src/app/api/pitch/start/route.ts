import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pitchStartSchema } from "@/lib/validators";
import { generateQuestions } from "@/agents/vc-evaluator";
import { checkRateLimit } from "@/lib/rate-limit";
import { logEvent } from "@/lib/tracking";
import { created, badRequest, tooManyRequests, serverError } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = pitchStartSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = checkRateLimit(`pitch:${ip}`, 20, 60 * 60 * 1000);
    if (!rl.allowed) {
      return tooManyRequests("시간당 20회까지 심사 가능합니다. 잠시 후 다시 시도해주세요.");
    }

    const { ideaText, ...utm } = parsed.data;

    const session = await prisma.pitchSession.create({
      data: {
        ideaText,
        status: "PENDING",
        ...utm,
      },
    });

    await logEvent("pitch_start", { sessionId: session.id });

    try {
      const questions = await generateQuestions(ideaText);

      const updated = await prisma.pitchSession.update({
        where: { id: session.id },
        data: {
          status: "QUESTIONS_READY",
          questions: questions as unknown as Prisma.InputJsonValue,
        },
      });

      await logEvent("questions_generated", {
        sessionId: session.id,
        properties: { questionCount: questions.length },
      });

      return created({
        id: updated.id,
        status: updated.status,
        questions,
      });
    } catch (genError) {
      console.error("[pitch/start] question generation failed:", genError);

      await prisma.pitchSession.update({
        where: { id: session.id },
        data: { status: "FAILED" },
      });

      return serverError("AI VC가 질문을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  } catch (error) {
    console.error("[pitch/start]", error);
    return serverError("서버 오류가 발생했습니다.");
  }
}
