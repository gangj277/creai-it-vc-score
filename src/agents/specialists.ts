import OpenAI from "openai";
import { env } from "@/lib/env";
import {
  SPECIALIST_PROMPTS,
  specialistUserPrompt,
  type SpecialistKey,
} from "@/agents/prompts";
import type { DimensionKey, DimensionScore, SpecialistResult } from "@/agents/types";

const client = new OpenAI({ apiKey: env.openAiApiKey || "missing-api-key" });

/* ---------- Specialist Definitions ---------- */

interface SpecialistConfig {
  key: DimensionKey;
  promptKey: SpecialistKey;
  dimension: string;
  weight: number;
}

const SPECIALISTS: SpecialistConfig[] = [
  { key: "market", promptKey: "market", dimension: "시장 기회", weight: 25 },
  { key: "solution", promptKey: "solution", dimension: "문제-솔루션 적합성", weight: 25 },
  { key: "execution", promptKey: "execution", dimension: "실행 가능성", weight: 20 },
  { key: "competitive", promptKey: "competitive", dimension: "경쟁 우위", weight: 15 },
  { key: "growth", promptKey: "growth", dimension: "성장/바이럴", weight: 15 },
];

/* ---------- Structured Output Schema ---------- */

const SPECIALIST_SCHEMA = {
  type: "json_schema" as const,
  name: "specialist_evaluation",
  strict: true,
  schema: {
    type: "object",
    properties: {
      score: { type: "number" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      comment: { type: "string" },
    },
    required: ["score", "confidence", "comment"],
    additionalProperties: false,
  },
};

/* ---------- Single Specialist Call ---------- */

async function runSpecialist(
  config: SpecialistConfig,
  ideaText: string,
  questions: { question: string }[],
  answers: string[],
): Promise<DimensionScore> {
  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.responses.create({
        model: env.openAiModel,
        reasoning: { effort: "minimal" },
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: SPECIALIST_PROMPTS[config.promptKey] }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: specialistUserPrompt(ideaText, questions, answers) }],
          },
        ],
        text: { format: SPECIALIST_SCHEMA },
      });

      const text = response.output_text?.trim();
      if (!text) throw new Error(`Empty output from ${config.dimension} specialist`);

      const parsed: SpecialistResult = JSON.parse(text);
      const score = Math.max(0, Math.min(100, Math.round(parsed.score)));

      return {
        key: config.key,
        dimension: config.dimension,
        score,
        weight: config.weight,
        confidence: parsed.confidence,
        comment: parsed.comment,
      };
    } catch (error) {
      lastError = error;
      console.error(`[specialist:${config.key}] attempt ${attempt} failed:`, error);
      if (attempt === maxAttempts) throw error;
    }
  }

  throw lastError ?? new Error(`${config.dimension} specialist failed`);
}

/* ---------- Run All Specialists in Parallel ---------- */

export async function runAllSpecialists(
  ideaText: string,
  questions: { question: string }[],
  answers: string[],
): Promise<DimensionScore[]> {
  const results = await Promise.all(
    SPECIALISTS.map((spec) => runSpecialist(spec, ideaText, questions, answers)),
  );
  return results;
}

/* ---------- Calculate Weighted Score ---------- */

export function calculateWeightedScore(breakdown: DimensionScore[]): number {
  const weighted = breakdown.reduce((sum, d) => sum + d.score * d.weight, 0);
  return Math.round(weighted / 100);
}
