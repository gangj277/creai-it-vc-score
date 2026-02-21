import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pitchAnswerSchema } from "@/lib/validators";
import { evaluatePitch } from "@/agents/vc-evaluator";
import { logEvent } from "@/lib/tracking";
import { ok, badRequest, notFound, serverError } from "@/lib/http";
import type { QuestionItem } from "@/agents/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = pitchAnswerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid answers", parsed.error.flatten());
    }

    const session = await prisma.pitchSession.findUnique({
      where: { id },
      select: { id: true, status: true, ideaText: true, questions: true },
    });

    if (!session) {
      return notFound("세션을 찾을 수 없습니다.");
    }

    if (session.status !== "QUESTIONS_READY") {
      return badRequest("이미 심사가 진행되었거나 유효하지 않은 세션입니다.");
    }

    const questions = session.questions as unknown as QuestionItem[];
    if (!questions || questions.length === 0) {
      return badRequest("질문이 생성되지 않은 세션입니다.");
    }

    const { answers } = parsed.data;

    await prisma.pitchSession.update({
      where: { id },
      data: {
        status: "EVALUATING",
        answers: answers as unknown as Prisma.InputJsonValue,
      },
    });

    await logEvent("questions_submitted", {
      sessionId: id,
      properties: { answerCount: answers.length },
    });

    try {
      const result = await evaluatePitch(session.ideaText, questions, answers);

      const updated = await prisma.pitchSession.update({
        where: { id },
        data: {
          status: "COMPLETED",
          score: result.score,
          verdict: result.verdict,
          vcComment: result.vcComment,
          percentile: result.percentile,
          evaluationDetails: result.evaluationDetails as unknown as Prisma.InputJsonValue,
          model: (await import("@/lib/env")).env.openAiModel,
        },
      });

      await logEvent("pitch_completed", {
        sessionId: id,
        properties: { score: result.score, verdict: result.verdict },
      });

      return ok({
        id: updated.id,
        publicId: updated.publicId,
        status: updated.status,
        score: updated.score,
        verdict: updated.verdict,
        vcComment: updated.vcComment,
        percentile: updated.percentile,
      });
    } catch (evalError) {
      console.error("[pitch/answer] evaluation failed:", evalError);

      await prisma.pitchSession.update({
        where: { id },
        data: { status: "FAILED" },
      });

      await logEvent("pitch_failed", {
        sessionId: id,
        properties: { error: String(evalError) },
      });

      return serverError("AI 심사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  } catch (error) {
    console.error("[pitch/answer]", error);
    return serverError("서버 오류가 발생했습니다.");
  }
}
