import { PostHog } from "posthog-node";
import { env } from "@/lib/env";

let posthogClient: PostHog | null = null;

export function getPosthogServerClient() {
  if (!env.posthogKey) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(env.posthogKey, {
      host: env.posthogHost,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}
