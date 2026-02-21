import { z } from "zod";

export const pitchStartSchema = z.object({
  ideaText: z.string().min(5, "아이디어는 최소 5자 이상이어야 합니다").max(500, "아이디어는 최대 500자까지 가능합니다"),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(160).optional(),
  utmTerm: z.string().max(160).optional(),
  utmContent: z.string().max(160).optional(),
  referrer: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
});

export const pitchAnswerSchema = z.object({
  answers: z.array(z.string().min(1).max(1000)).min(2).max(4),
});

export const eventSchema = z.object({
  eventName: z.enum([
    "result_view",
    "cta_landing_click",
    "cta_apply_click",
    "share_link_copied",
    "share_native",
    "share_card_downloaded",
    "retry_click",
    "questions_view",
    "questions_submitted",
  ]),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export type PitchStartInput = z.infer<typeof pitchStartSchema>;
export type PitchAnswerInput = z.infer<typeof pitchAnswerSchema>;
export type EventInput = z.infer<typeof eventSchema>;
