import OpenAI from "openai";
import { env } from "@/lib/env";
import { SYNTHESIZER_PROMPT, synthesizerUserPrompt } from "@/agents/prompts";
import type { DimensionScore, SynthesizerResult } from "@/agents/types";

const client = new OpenAI({ apiKey: env.openAiApiKey || "missing-api-key" });

/* ---------- Structured Output Schema ---------- */

const SYNTHESIZER_SCHEMA = {
  type: "json_schema" as const,
  name: "synthesizer_result",
  strict: true,
  schema: {
    type: "object",
    properties: {
      vcComment: { type: "string" },
      percentile: { type: "number" },
      highlights: { type: "array", items: { type: "string" } },
      improvements: { type: "array", items: { type: "string" } },
    },
    required: ["vcComment", "percentile", "highlights", "improvements"],
    additionalProperties: false,
  },
};

/* ---------- Synthesize ---------- */

export async function synthesize(
  ideaText: string,
  totalScore: number,
  verdict: string,
  breakdown: DimensionScore[],
): Promise<SynthesizerResult> {
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
            content: [{ type: "input_text", text: SYNTHESIZER_PROMPT }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: synthesizerUserPrompt(
                  ideaText,
                  totalScore,
                  verdict,
                  breakdown.map((d) => ({
                    dimension: d.dimension,
                    score: d.score,
                    weight: d.weight,
                    confidence: d.confidence,
                    comment: d.comment,
                  })),
                ),
              },
            ],
          },
        ],
        text: { format: SYNTHESIZER_SCHEMA },
      });

      const text = response.output_text?.trim();
      if (!text) throw new Error("Empty output from synthesizer");

      const parsed: SynthesizerResult = JSON.parse(text);

      return {
        vcComment: parsed.vcComment,
        percentile: Math.round(parsed.percentile * 10) / 10,
        highlights: parsed.highlights.slice(0, 2),
        improvements: parsed.improvements.slice(0, 2),
      };
    } catch (error) {
      lastError = error;
      console.error(`[synthesizer] attempt ${attempt} failed:`, error);
      if (attempt === maxAttempts) throw error;
    }
  }

  throw lastError ?? new Error("Synthesizer failed");
}
