import { z } from "zod";

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),

  DATABASE_URL: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),

  NEXT_PUBLIC_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_LANDING_URL: z.string().optional(),
  NEXT_PUBLIC_APPLY_URL: z.string().optional(),

  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

  PII_ENCRYPTION_KEY: z.string().optional(),
  RATE_LIMIT_SECRET: z.string().optional(),

  AUTH_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
});

const raw = rawEnvSchema.parse(process.env);

export const env = {
  nodeEnv: raw.NODE_ENV ?? "development",

  databaseUrl: raw.DATABASE_URL ?? "",

  openAiApiKey: raw.OPENAI_API_KEY ?? "",
  openAiModel: raw.OPENAI_MODEL ?? "gpt-5-mini",

  baseUrl: raw.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  landingUrl: raw.NEXT_PUBLIC_LANDING_URL ?? "https://creaiitpage.vercel.app",
  applyUrl: raw.NEXT_PUBLIC_APPLY_URL ?? raw.NEXT_PUBLIC_LANDING_URL ?? "https://creaiitpage.vercel.app",

  posthogKey: raw.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  posthogHost: raw.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",

  piiEncryptionKey: raw.PII_ENCRYPTION_KEY ?? "",
  rateLimitSecret: raw.RATE_LIMIT_SECRET ?? "local-rate-limit-secret",

  authSecret: raw.AUTH_SECRET ?? "local-auth-secret",
  adminEmail: raw.ADMIN_EMAIL ?? "",
  adminPasswordHash: raw.ADMIN_PASSWORD_HASH ?? "",
};

export function assertServerEnvForScoring() {
  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }
}
