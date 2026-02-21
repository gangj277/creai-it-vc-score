import OpenAI from "openai";
import { z } from "zod";
import { env, assertServerEnvForScoring } from "@/lib/env";
import {
  QUESTION_GENERATION_PROMPT,
  questionGenerationUserPrompt,
} from "@/agents/prompts";
import { runAllSpecialists, calculateWeightedScore } from "@/agents/specialists";
import { synthesize } from "@/agents/synthesizer";
import type { QuestionItem, VCEvaluationResult, VerdictKey } from "@/agents/types";

const client = new OpenAI({ apiKey: env.openAiApiKey || "missing-api-key" });

/* ---------- Schemas ---------- */

const questionOutputSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      question: z.string().min(1),
      hint: z.string().min(1),
      options: z.array(z.string()).min(2).max(4),
    })
  ).min(2).max(4),
});

/* ---------- Helpers ---------- */

function parseJsonPayload<T>(text: string, schema: z.ZodSchema<T>): T {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model output does not contain JSON object");
  }

  const jsonText = text.slice(firstBrace, lastBrace + 1);
  const parsed = JSON.parse(jsonText);
  return schema.parse(parsed);
}

function scoreToVerdict(score: number): VerdictKey {
  if (score >= 80) return "UNICORN";
  if (score >= 60) return "SEED";
  if (score >= 40) return "HOLD";
  return "COME_BACK";
}

/* ---------- Step 1: Generate Questions (unchanged) ---------- */

export async function generateQuestions(ideaText: string): Promise<QuestionItem[]> {
  assertServerEnvForScoring();

  const model = env.openAiModel;
  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.responses.create({
        model,
        reasoning: { effort: "minimal" },
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: QUESTION_GENERATION_PROMPT }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: questionGenerationUserPrompt(ideaText) }],
          },
        ],
      });

      const text = response.output_text?.trim();
      if (!text) throw new Error("Empty model output");

      const parsed = parseJsonPayload(text, questionOutputSchema);
      return parsed.questions;
    } catch (error) {
      lastError = error;
      console.error(`[vc-evaluator] generateQuestions attempt ${attempt} failed:`, error);
      if (attempt === maxAttempts) throw error;
    }
  }

  throw lastError ?? new Error("Question generation failed");
}

/* ---------- Step 2: Multi-Agent Evaluation ---------- */

export async function evaluatePitch(
  ideaText: string,
  questions: { question: string }[],
  answers: string[]
): Promise<VCEvaluationResult> {
  assertServerEnvForScoring();

  console.log("[vc-evaluator] Starting multi-agent evaluation...");
  const startTime = Date.now();

  // Phase 1: Run 5 specialist agents in parallel
  console.log("[vc-evaluator] Phase 1: Running 5 specialists in parallel...");
  const breakdown = await runAllSpecialists(ideaText, questions, answers);
  const specialistTime = Date.now() - startTime;
  console.log(`[vc-evaluator] Specialists completed in ${specialistTime}ms`);

  for (const d of breakdown) {
    console.log(`  [${d.key}] ${d.score}/100 (${d.confidence}) — ${d.comment.slice(0, 50)}...`);
  }

  // Calculate weighted score
  const totalScore = calculateWeightedScore(breakdown);
  const verdict = scoreToVerdict(totalScore);
  console.log(`[vc-evaluator] Weighted score: ${totalScore}, verdict: ${verdict}`);

  // Phase 2: Synthesizer agent
  console.log("[vc-evaluator] Phase 2: Running synthesizer...");
  const synthesis = await synthesize(ideaText, totalScore, verdict, breakdown);
  const totalTime = Date.now() - startTime;
  console.log(`[vc-evaluator] Synthesizer completed. Total time: ${totalTime}ms`);

  return {
    score: totalScore,
    verdict,
    vcComment: synthesis.vcComment,
    percentile: synthesis.percentile,
    evaluationDetails: {
      breakdown,
      highlights: synthesis.highlights,
      improvements: synthesis.improvements,
    },
  };
}
